let electron = require("electron");
//#region electron/preload.ts
electron.contextBridge.exposeInMainWorld("electronAPI", {
	getNotes: () => electron.ipcRenderer.invoke("get-notes"),
	saveNote: (note) => electron.ipcRenderer.invoke("save-note", note),
	deleteNote: (noteId) => electron.ipcRenderer.invoke("delete-note", noteId),
	minimize: () => electron.ipcRenderer.send("window-min"),
	maximize: () => electron.ipcRenderer.send("window-max"),
	close: () => electron.ipcRenderer.send("window-close"),
	closeQuickCapture: () => electron.ipcRenderer.send("close-quick-capture"),
	log: (...args) => electron.ipcRenderer.send("log", args)
});
//#endregion
