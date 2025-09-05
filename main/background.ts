import path from 'path'
import { app, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

let mainWindow: Electron.BrowserWindow

;(async () => {
  await app.whenReady()

  mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  
  if (isProd) {
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    mainWindow.webContents.openDevTools()
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

 ipcMain.on('close-window', () => {
    app.quit();
  });

    ipcMain.on('minimize-window', () => {
    // The .minimize() function is a built-in method of the BrowserWindow class.
    mainWindow.minimize();
  });

  // Handler for the MAXIMIZE/RESTORE button
  ipcMain.on('maximize-window', () => {
    // We check if the window is already maximized.
    if (mainWindow.isMaximized()) {
      // If it is, we restore it to its previous size.
      mainWindow.unmaximize();
    } else {
      // If it's not, we maximize it.
      mainWindow.maximize();
    }
  });

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})
