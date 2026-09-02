const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
const { createClient } = require("@supabase/supabase-js");
const WebSocketImpl = require("ws");
const { autoUpdater } = require("electron-updater");

const { fileStorage } = require("./sessionStorage");
const { runFfmpeg, buildMusicOverlayArgs, uniqueOutputPath } = require("./ffmpeg");

let env;
try {
  // env.js não vai commitado no repositório (veja env.example.js) — em
  // produção ele é gerado pelo GitHub Actions a partir de Secrets antes do
  // build, então acaba empacotado dentro do app normalmente.
  env = require("./env.js");
} catch {
  env = null;
}

let mainWindow;
let supabase = null;
let configError = null;

if (!env || !env.SUPABASE_URL || env.SUPABASE_URL.includes("SEU-PROJETO")) {
  configError =
    "O programa não foi configurado corretamente (faltam as credenciais do Supabase em src/env.js). Avise o suporte.";
} else {
  supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      storage: fileStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    // O supabase-js sempre monta um cliente de "realtime" internamente (mesmo
    // sem a gente usar), e ele precisa de um WebSocket. No processo principal
    // do Electron o Node não tem WebSocket nativo (só a partir do Node 22+, e
    // o Electron usa uma versão mais antiga) — por isso passamos a
    // implementação da lib "ws" aqui, senão o app trava ao iniciar com
    // "Node.js detected but native WebSocket not found".
    realtime: {
      transport: WebSocketImpl,
    },
  });
}

const CHECKOUT_URL = "https://digitalsupply.pro/dashboard/desktop";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 880,
    height: 760,
    minWidth: 720,
    minHeight: 600,
    backgroundColor: "#0d0d0b",
    icon: path.join(__dirname, "..", "assets", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

app.whenReady().then(() => {
  createWindow();
  // Espera a janela existir antes de checar — os eventos do autoUpdater
  // avisam a tela via mainWindow.webContents.send.
  autoUpdater.checkForUpdates().catch(() => {});
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ------------------------------------------------------------
// Auto-atualização
// ------------------------------------------------------------
// A cada build publicada pelo GitHub Actions (.github/workflows/build-desktop.yml),
// o programa passa a se atualizar sozinho: baixa a versão nova em segundo
// plano assim que abre, e instala quando o aluno reinicia (ou clica em
// "Reiniciar e atualizar" no aviso que aparece). Sem isso, toda mudança de
// código (mesmo um texto ou aviso) só chegava a quem já tinha o programa
// instalado se a pessoa baixasse e reinstalasse manualmente de novo.
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function sendUpdateStatus(status, extra = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update:status", { status, ...extra });
  }
}

autoUpdater.on("update-available", (info) => {
  sendUpdateStatus("available", { version: info?.version });
});

autoUpdater.on("update-downloaded", (info) => {
  sendUpdateStatus("downloaded", { version: info?.version });
});

autoUpdater.on("error", (err) => {
  // Silencioso de propósito — não interrompe o uso do programa por causa
  // de uma falha ao checar atualização (ex: sem internet no momento).
  sendUpdateStatus("error", { message: err?.message || String(err) });
});

ipcMain.handle("update:install", () => {
  autoUpdater.quitAndInstall();
});

// ------------------------------------------------------------
// Auth
// ------------------------------------------------------------
async function loadAccountState() {
  if (configError) return { status: "config_error", message: configError };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { status: "logged_out" };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("email, is_admin, desktop_app_purchased")
    .eq("id", userData.user.id)
    .single();

  if (error || !profile) {
    return { status: "logged_out" };
  }

  const canUse = !!profile.is_admin || !!profile.desktop_app_purchased;

  return {
    status: canUse ? "ready" : "not_purchased",
    email: profile.email,
    isAdmin: !!profile.is_admin,
  };
}

ipcMain.handle("auth:restore", async () => {
  try {
    return await loadAccountState();
  } catch (err) {
    return { status: "logged_out" };
  }
});

ipcMain.handle("auth:login", async (_evt, { email, password }) => {
  if (configError) return { status: "config_error", message: configError };
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { status: "error", message: "E-mail ou senha incorretos." };
    }
    return await loadAccountState();
  } catch (err) {
    return { status: "error", message: "Não consegui conectar. Confira sua internet e tente de novo." };
  }
});

ipcMain.handle("auth:logout", async () => {
  if (supabase) await supabase.auth.signOut().catch(() => {});
  return { status: "logged_out" };
});

ipcMain.handle("purchase:openCheckout", () => {
  shell.openExternal(CHECKOUT_URL);
});

ipcMain.handle("app:getVersion", () => app.getVersion());

ipcMain.handle("app:getCoverUrl", async () => {
  if (!supabase) return null;
  try {
    const { data } = await supabase.from("site_settings").select("cover_path").eq("id", "main").maybeSingle();
    if (!data?.cover_path) return null;
    return supabase.storage.from("content-covers").getPublicUrl(data.cover_path).data.publicUrl;
  } catch {
    return null;
  }
});

// ------------------------------------------------------------
// Seletores de arquivo
// ------------------------------------------------------------
ipcMain.handle("pick:music", async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: "Escolha a música",
    properties: ["openFile"],
    filters: [{ name: "Áudio", extensions: ["mp3", "wav", "m4a", "aac", "ogg", "flac"] }],
  });
  if (res.canceled || res.filePaths.length === 0) return null;
  const filePath = res.filePaths[0];
  return { path: filePath, url: pathToFileURL(filePath).href, name: path.basename(filePath) };
});

// ------------------------------------------------------------
// Biblioteca de músicas (gerenciada pelo admin no painel do site)
// ------------------------------------------------------------
ipcMain.handle("library:list", async () => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("music_library")
    .select("id, title, storage_path")
    .order("order_index", { ascending: true });
  if (error || !data) return [];
  return data;
});

ipcMain.handle("library:pick", async (_evt, track) => {
  if (!supabase || !track?.storage_path) return null;

  const { data, error } = await supabase.storage.from("music-library").download(track.storage_path);
  if (error || !data) return null;

  const buffer = Buffer.from(await data.arrayBuffer());
  const extMatch = /\.([a-zA-Z0-9]+)$/.exec(track.storage_path);
  const ext = extMatch ? extMatch[1].toLowerCase() : "mp3";
  const safeName = (track.title || "musica").replace(/[^a-zA-Z0-9._ -]/g, "_").trim() || "musica";
  const tempPath = path.join(app.getPath("temp"), `dgs-biblioteca-${Date.now()}-${safeName}.${ext}`);

  fs.writeFileSync(tempPath, buffer);

  return { path: tempPath, url: pathToFileURL(tempPath).href, name: `${safeName}.${ext}` };
});

ipcMain.handle("pick:videos", async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: "Escolha os vídeos (pode selecionar vários)",
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Vídeos", extensions: ["mp4", "mov", "mkv", "avi", "webm", "m4v"] }],
  });
  if (res.canceled) return [];
  return res.filePaths.map((p) => ({ path: p, name: path.basename(p) }));
});

ipcMain.handle("app:getDefaultOutputFolder", () => {
  try {
    return path.join(app.getPath("videos"), "Editor de Músicas");
  } catch {
    return path.join(app.getPath("desktop"), "Editor de Músicas");
  }
});

ipcMain.handle("pick:outputFolder", async (_evt, suggestedPath) => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: "Escolha onde salvar os vídeos prontos",
    defaultPath: suggestedPath,
    properties: ["openDirectory", "createDirectory"],
  });
  if (res.canceled || res.filePaths.length === 0) return null;
  return res.filePaths[0];
});

ipcMain.handle("shell:openFolder", (_evt, folderPath) => {
  shell.openPath(folderPath);
});

// ------------------------------------------------------------
// Processamento
// ------------------------------------------------------------
ipcMain.handle("process:start", async (evt, { videoPaths, musicPath, musicStartSeconds, outputFolder }) => {
  const sender = evt.sender;

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  let done = 0;
  let failed = 0;

  for (const videoPath of videoPaths) {
    const name = path.basename(videoPath);
    sender.send("process:progress", { videoPath, status: "processing" });

    try {
      const outputPath = uniqueOutputPath(outputFolder, name.replace(/\.[^.]+$/, ".mp4"));
      await runFfmpeg(
        buildMusicOverlayArgs({
          videoPath,
          musicPath,
          musicStartSeconds,
          outputPath,
        })
      );
      done++;
      sender.send("process:progress", { videoPath, status: "done", outputPath });
    } catch (err) {
      failed++;
      sender.send("process:progress", { videoPath, status: "failed", error: err.message || String(err) });
    }
  }

  return { done, failed, outputFolder };
});
