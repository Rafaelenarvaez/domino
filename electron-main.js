const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
    icon: path.join(__dirname, "src/assets/IMG_5750.ico"),
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    // ✅ En desarrollo: carga Angular por localhost
    win.loadURL("http://localhost:4200/#/");
    // win.webContents.openDevTools({ mode: "detach" });
  } else {
    // ✅ En producción: carga el build
    win.loadFile(path.join(__dirname, "dist/anotador/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
