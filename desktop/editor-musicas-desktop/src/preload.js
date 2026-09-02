const { contextBridge, ipcRenderer } = require("electron");

// API exposta pra tela (renderer) — mantém o Node/Electron isolado do HTML,
// só passa essas funções específicas.
contextBridge.exposeInMainWorld("editorMusicas", {
  authRestore: () => ipcRenderer.invoke("auth:restore"),
  authLogin: (email, password) => ipcRenderer.invoke("auth:login", { email, password }),
  authLogout: () => ipcRenderer.invoke("auth:logout"),
  openCheckout: () => ipcRenderer.invoke("purchase:openCheckout"),

  pickMusic: () => ipcRenderer.invoke("pick:music"),
  libraryList: () => ipcRenderer.invoke("library:list"),
  libraryPick: (track) => ipcRenderer.invoke("library:pick", track),
  pickVideos: () => ipcRenderer.invoke("pick:videos"),
  getDefaultOutputFolder: () => ipcRenderer.invoke("app:getDefaultOutputFolder"),
  pickOutputFolder: (suggestedPath) => ipcRenderer.invoke("pick:outputFolder", suggestedPath),
  openFolder: (folderPath) => ipcRenderer.invoke("shell:openFolder", folderPath),

  startProcessing: (payload) => ipcRenderer.invoke("process:start", payload),
  onProgress: (callback) => {
    const listener = (_evt, data) => callback(data);
    ipcRenderer.on("process:progress", listener);
    return () => ipcRenderer.removeListener("process:progress", listener);
  },

  installUpdate: () => ipcRenderer.invoke("update:install"),
  onUpdateStatus: (callback) => {
    const listener = (_evt, data) => callback(data);
    ipcRenderer.on("update:status", listener);
    return () => ipcRenderer.removeListener("update:status", listener);
  },
});
