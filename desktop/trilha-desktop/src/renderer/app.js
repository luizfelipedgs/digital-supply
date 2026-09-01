(function () {
  const screens = {
    loading: document.getElementById("screen-loading"),
    error: document.getElementById("screen-error"),
    login: document.getElementById("screen-login"),
    notPurchased: document.getElementById("screen-not-purchased"),
    main: document.getElementById("screen-main"),
  };

  function showScreen(name) {
    Object.values(screens).forEach((el) => (el.hidden = true));
    screens[name].hidden = false;
  }

  function formatTime(s) {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  // ------------------------------------------------------------
  // Estado da conta
  // ------------------------------------------------------------
  async function applyAccountState(state) {
    if (state.status === "config_error") {
      document.getElementById("error-message").textContent = state.message;
      showScreen("error");
      return;
    }
    if (state.status === "logged_out") {
      showScreen("login");
      return;
    }
    if (state.status === "not_purchased") {
      showScreen("notPurchased");
      return;
    }
    if (state.status === "ready") {
      document.getElementById("account-badge").textContent = state.isAdmin
        ? `${state.email} (admin)`
        : state.email || "";
      showScreen("main");
      await initMainScreenDefaults();
      return;
    }
    showScreen("login");
  }

  async function boot() {
    const state = await window.trilha.authRestore();
    await applyAccountState(state);
  }

  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const errorEl = document.getElementById("login-error");
    errorEl.hidden = true;

    const submitBtn = document.getElementById("login-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Entrando…";

    const state = await window.trilha.authLogin(email, password);

    submitBtn.disabled = false;
    submitBtn.textContent = "Entrar";

    if (state.status === "error" || state.status === "config_error") {
      errorEl.textContent = state.message;
      errorEl.hidden = false;
      return;
    }
    await applyAccountState(state);
  });

  document.getElementById("logout").addEventListener("click", async () => {
    const state = await window.trilha.authLogout();
    resetBatchState();
    await applyAccountState(state);
  });

  document.getElementById("logout-from-blocked").addEventListener("click", async () => {
    const state = await window.trilha.authLogout();
    await applyAccountState(state);
  });

  document.getElementById("open-checkout").addEventListener("click", () => {
    window.trilha.openCheckout();
  });

  // ------------------------------------------------------------
  // Música
  // ------------------------------------------------------------
  let musicPath = null;
  let musicStartSeconds = 0;
  const audio = document.getElementById("audio-preview");
  const seek = document.getElementById("seek");
  const timeLabel = document.getElementById("time-label");
  const playPauseBtn = document.getElementById("play-pause");

  document.getElementById("pick-music").addEventListener("click", pickMusic);
  document.getElementById("change-music").addEventListener("click", pickMusic);

  async function pickMusic() {
    const result = await window.trilha.pickMusic();
    if (!result) return;
    musicPath = result.path;
    musicStartSeconds = 0;
    document.getElementById("music-name").textContent = result.name;
    document.getElementById("music-empty").hidden = true;
    document.getElementById("music-chosen").hidden = false;
    audio.src = result.url;
    audio.currentTime = 0;
    document.getElementById("start-label").textContent = "0:00";
    updateStartButtonState();
  }

  audio.addEventListener("loadedmetadata", () => {
    seek.max = String(audio.duration || 0);
  });
  audio.addEventListener("timeupdate", () => {
    seek.value = String(audio.currentTime);
    timeLabel.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration || 0)}`;
  });
  audio.addEventListener("play", () => (playPauseBtn.textContent = "❚❚"));
  audio.addEventListener("pause", () => (playPauseBtn.textContent = "▶"));
  audio.addEventListener("ended", () => (playPauseBtn.textContent = "▶"));

  playPauseBtn.addEventListener("click", () => {
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  });

  seek.addEventListener("input", () => {
    audio.currentTime = Number(seek.value);
  });

  document.getElementById("mark-start").addEventListener("click", () => {
    musicStartSeconds = audio.currentTime || 0;
    document.getElementById("start-label").textContent = formatTime(musicStartSeconds);
  });

  // ------------------------------------------------------------
  // Vídeos
  // ------------------------------------------------------------
  let videos = []; // { path, name, status }
  const videoList = document.getElementById("video-list");
  const videoCount = document.getElementById("video-count");

  document.getElementById("pick-videos").addEventListener("click", async () => {
    const picked = await window.trilha.pickVideos();
    if (!picked || picked.length === 0) return;
    const existing = new Set(videos.map((v) => v.path));
    for (const p of picked) {
      if (!existing.has(p.path)) {
        videos.push({ path: p.path, name: p.name, status: "queued" });
      }
    }
    renderVideos();
    updateStartButtonState();
  });

  function renderVideos() {
    videoCount.textContent = videos.length > 0 ? `(${videos.length})` : "";
    videoList.innerHTML = "";
    for (const v of videos) {
      const row = document.createElement("div");
      row.className = "item-row";

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = v.name;
      row.appendChild(name);

      if (v.status === "queued") {
        const removeBtn = document.createElement("button");
        removeBtn.className = "item-remove";
        removeBtn.textContent = "remover";
        removeBtn.addEventListener("click", () => {
          videos = videos.filter((x) => x.path !== v.path);
          renderVideos();
          updateStartButtonState();
        });
        row.appendChild(removeBtn);
      } else {
        const status = document.createElement("span");
        status.className = `item-status ${v.status}`;
        const labels = { processing: "processando…", done: "pronto", failed: "falhou" };
        status.textContent = labels[v.status] || v.status;
        if (v.status === "failed" && v.error) status.title = v.error;
        row.appendChild(status);
      }

      videoList.appendChild(row);
    }
  }

  // ------------------------------------------------------------
  // Pasta de destino
  // ------------------------------------------------------------
  let outputFolder = null;
  const outputFolderEl = document.getElementById("output-folder");

  async function initMainScreenDefaults() {
    if (!outputFolder) {
      outputFolder = await window.trilha.getDefaultOutputFolder();
      outputFolderEl.textContent = outputFolder;
    }
  }

  document.getElementById("pick-output").addEventListener("click", async () => {
    const chosen = await window.trilha.pickOutputFolder(outputFolder);
    if (chosen) {
      outputFolder = chosen;
      outputFolderEl.textContent = outputFolder;
    }
  });

  // ------------------------------------------------------------
  // Processamento
  // ------------------------------------------------------------
  const startBtn = document.getElementById("start");
  const runError = document.getElementById("run-error");
  const summary = document.getElementById("summary");

  function updateStartButtonState() {
    startBtn.disabled = !musicPath || videos.length === 0;
  }

  function resetBatchState() {
    musicPath = null;
    musicStartSeconds = 0;
    videos = [];
    document.getElementById("music-empty").hidden = false;
    document.getElementById("music-chosen").hidden = true;
    audio.removeAttribute("src");
    renderVideos();
    summary.hidden = true;
    runError.hidden = true;
    updateStartButtonState();
    startBtn.hidden = false;
  }

  let removeProgressListener = null;

  startBtn.addEventListener("click", async () => {
    if (!musicPath || videos.length === 0 || !outputFolder) return;

    runError.hidden = true;
    summary.hidden = true;
    startBtn.disabled = true;
    startBtn.textContent = "Processando…";

    videos = videos.map((v) => ({ ...v, status: "queued" }));
    renderVideos();

    if (removeProgressListener) removeProgressListener();
    removeProgressListener = window.trilha.onProgress((data) => {
      const item = videos.find((v) => v.path === data.videoPath);
      if (!item) return;
      item.status = data.status;
      if (data.error) item.error = data.error;
      renderVideos();
    });

    try {
      const result = await window.trilha.startProcessing({
        videoPaths: videos.map((v) => v.path),
        musicPath,
        musicStartSeconds,
        outputFolder,
      });

      document.getElementById("summary-text").textContent =
        `${result.done} de ${videos.length} vídeo${videos.length === 1 ? "" : "s"} processado${result.done === 1 ? "" : "s"} com sucesso` +
        (result.failed > 0 ? ` — ${result.failed} falharam.` : ".");
      summary.hidden = false;
      startBtn.hidden = true;
    } catch (err) {
      runError.textContent = err?.message || "Erro inesperado ao processar os vídeos.";
      runError.hidden = false;
    } finally {
      startBtn.disabled = false;
      startBtn.textContent = "Iniciar processamento";
    }
  });

  document.getElementById("open-output-folder").addEventListener("click", () => {
    if (outputFolder) window.trilha.openFolder(outputFolder);
  });

  document.getElementById("new-batch").addEventListener("click", () => {
    resetBatchState();
  });

  boot();
})();
