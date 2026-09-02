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
  // Auto-atualização
  // ------------------------------------------------------------
  const updateBanner = document.getElementById("update-banner");
  const updateBannerText = document.getElementById("update-banner-text");
  const updateRestartBtn = document.getElementById("update-restart");

  window.editorMusicas.onUpdateStatus((data) => {
    if (data.status === "available") {
      updateBanner.hidden = false;
      updateBannerText.textContent = "Baixando uma atualização em segundo plano…";
      updateRestartBtn.hidden = true;
    } else if (data.status === "downloaded") {
      updateBanner.hidden = false;
      updateBannerText.textContent = "Atualização pronta!";
      updateRestartBtn.hidden = false;
    } else if (data.status === "error") {
      updateBanner.hidden = true;
    }
  });

  updateRestartBtn.addEventListener("click", () => {
    window.editorMusicas.installUpdate();
  });

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
    window.editorMusicas
      .getVersion()
      .then((version) => {
        const el = document.getElementById("app-version");
        if (el && version) el.textContent = `v${version}`;
      })
      .catch(() => {});

    window.editorMusicas
      .getCoverUrl()
      .then((url) => {
        const banner = document.getElementById("cover-banner");
        const img = document.getElementById("cover-banner-img");
        if (!banner || !img) return;
        if (url) {
          img.src = url;
          banner.hidden = false;
        } else {
          banner.hidden = true;
        }
      })
      .catch(() => {});

    const state = await window.editorMusicas.authRestore();
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

    const state = await window.editorMusicas.authLogin(email, password);

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
    const state = await window.editorMusicas.authLogout();
    resetBatchState();
    await applyAccountState(state);
  });

  document.getElementById("logout-from-blocked").addEventListener("click", async () => {
    const state = await window.editorMusicas.authLogout();
    await applyAccountState(state);
  });

  document.getElementById("open-checkout").addEventListener("click", () => {
    window.editorMusicas.openCheckout();
  });

  // ------------------------------------------------------------
  // Música
  // ------------------------------------------------------------
  let musicPath = null;
  let musicStartSeconds = 0;
  let libraryTracks = null; // cache — só busca da 1ª vez que a aba é aberta
  const audio = document.getElementById("audio-preview");
  const seek = document.getElementById("seek");
  const timeLabel = document.getElementById("time-label");
  const playPauseBtn = document.getElementById("play-pause");

  const tabUploadBtn = document.getElementById("tab-upload");
  const tabLibraryBtn = document.getElementById("tab-library");
  const uploadPanel = document.getElementById("music-upload-panel");
  const libraryPanel = document.getElementById("music-library-panel");
  const libraryListEl = document.getElementById("library-list");
  const libraryEmptyEl = document.getElementById("library-empty");
  const libraryLoadingEl = document.getElementById("library-loading");

  tabUploadBtn.addEventListener("click", () => showMusicTab("upload"));
  tabLibraryBtn.addEventListener("click", () => showMusicTab("library"));

  function showMusicTab(tab) {
    tabUploadBtn.classList.toggle("tab-active", tab === "upload");
    tabLibraryBtn.classList.toggle("tab-active", tab === "library");
    uploadPanel.hidden = tab !== "upload";
    libraryPanel.hidden = tab !== "library";
    if (tab === "library") loadLibraryTracks();
  }

  async function loadLibraryTracks() {
    if (libraryTracks !== null) return;
    libraryLoadingEl.hidden = false;
    libraryEmptyEl.hidden = true;
    const tracks = await window.editorMusicas.libraryList();
    libraryTracks = tracks || [];
    libraryLoadingEl.hidden = true;
    renderLibraryList();
  }

  function renderLibraryList() {
    libraryListEl.innerHTML = "";
    if (!libraryTracks || libraryTracks.length === 0) {
      libraryEmptyEl.hidden = false;
      return;
    }
    libraryEmptyEl.hidden = true;

    for (const track of libraryTracks) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "library-item";

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = track.title;
      btn.appendChild(name);

      const hint = document.createElement("span");
      hint.className = "pick-hint";
      hint.textContent = "usar";
      btn.appendChild(hint);

      btn.addEventListener("click", async () => {
        btn.disabled = true;
        hint.textContent = "carregando…";
        const result = await window.editorMusicas.libraryPick(track);
        btn.disabled = false;
        hint.textContent = "usar";
        if (!result) return;
        applyMusicResult(result);
      });

      libraryListEl.appendChild(btn);
    }
  }

  document.getElementById("pick-music").addEventListener("click", pickMusic);
  document.getElementById("change-music").addEventListener("click", () => {
    musicPath = null;
    musicStartSeconds = 0;
    document.getElementById("music-empty").hidden = false;
    document.getElementById("music-chosen").hidden = true;
    audio.removeAttribute("src");
    updateSeekMarker();
    showMusicTab("upload");
    updateStartButtonState();
  });

  async function pickMusic() {
    const result = await window.editorMusicas.pickMusic();
    if (!result) return;
    applyMusicResult(result);
  }

  function applyMusicResult(result) {
    musicPath = result.path;
    musicStartSeconds = 0;
    document.getElementById("music-name").textContent = result.name;
    document.getElementById("music-empty").hidden = true;
    document.getElementById("music-chosen").hidden = false;
    audio.src = result.url;
    audio.currentTime = 0;
    document.getElementById("start-label").textContent = "0:00";
    updateSeekMarker();
    updateStartButtonState();
  }

  const seekMarker = document.getElementById("seek-marker");

  function updateSeekMarker() {
    if (!seekMarker) return;
    const duration = audio.duration || 0;
    if (duration > 0 && musicStartSeconds > 0) {
      seekMarker.style.left = `${Math.min(100, (musicStartSeconds / duration) * 100)}%`;
      seekMarker.hidden = false;
    } else {
      seekMarker.hidden = true;
    }
  }

  audio.addEventListener("loadedmetadata", () => {
    seek.max = String(audio.duration || 0);
    updateSeekMarker();
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

  const markStartBtn = document.getElementById("mark-start");
  let markStartTimeout = null;

  markStartBtn.addEventListener("click", () => {
    musicStartSeconds = audio.currentTime || 0;
    document.getElementById("start-label").textContent = formatTime(musicStartSeconds);
    updateSeekMarker();

    markStartBtn.classList.add("btn-marked");
    markStartBtn.textContent = "✓ Marcado!";
    clearTimeout(markStartTimeout);
    markStartTimeout = setTimeout(() => {
      markStartBtn.classList.remove("btn-marked");
      markStartBtn.textContent = "Marcar início aqui";
    }, 1600);
  });

  // ------------------------------------------------------------
  // Vídeos
  // ------------------------------------------------------------
  let videos = []; // { path, name, status }
  const videoList = document.getElementById("video-list");
  const videoCount = document.getElementById("video-count");

  document.getElementById("pick-videos").addEventListener("click", async () => {
    const picked = await window.editorMusicas.pickVideos();
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
      outputFolder = await window.editorMusicas.getDefaultOutputFolder();
      outputFolderEl.textContent = outputFolder;
    }
  }

  document.getElementById("pick-output").addEventListener("click", async () => {
    const chosen = await window.editorMusicas.pickOutputFolder(outputFolder);
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
    updateSeekMarker();
    showMusicTab("upload");
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
    removeProgressListener = window.editorMusicas.onProgress((data) => {
      const item = videos.find((v) => v.path === data.videoPath);
      if (!item) return;
      item.status = data.status;
      if (data.error) item.error = data.error;
      renderVideos();
    });

    try {
      const result = await window.editorMusicas.startProcessing({
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
    if (outputFolder) window.editorMusicas.openFolder(outputFolder);
  });

  document.getElementById("new-batch").addEventListener("click", () => {
    resetBatchState();
  });

  boot();
})();
