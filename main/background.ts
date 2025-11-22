import path from 'path'
import { app, ipcMain, globalShortcut } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import * as fs from "fs";
import WinReg from 'winreg';
import { execFile, spawn } from 'child_process';
import { a } from 'framer-motion/dist/types.d-BJcRxCew';
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
    icon: '/images/icon.png',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      devTools: true,
      backgroundThrottling: false, 
    },
  })
  
  if (isProd) {
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    //mainWindow.webContents.openDevTools()
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.handle('launch-application', async (event, exePath) => {
  if (!exePath) {
    return { success: false, error: 'No executable path provided.' };
  }

  console.log(`Attempting to launch: ${exePath}`);

  return new Promise((resolve) => {
    execFile(exePath, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to launch application: ${error.message}`);
        resolve({ success: false, error: error.message });
        return;
      }
      // You can log stdout or stderr if the application outputs anything on launch
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
      
      resolve({ success: true });
    });
  });
});

ipcMain.handle('get-registry-value', async (event, keyPath) => {
  console.log(`Main process received request for registry key: ${keyPath}`);
  try {
    const regKey = new WinReg({
      hive: WinReg.HKLM, // Example Hive
      key: keyPath,     // Use the path sent from the renderer
    });

    // Wrap the callback-based winreg method in a Promise
    const productName = await new Promise((resolve, reject) => {
      regKey.get('ProductName', (err, item) => {
        if (err) {
          console.error('Error reading registry:', err);
          return reject(err);
        }
        resolve(item.value);
      });
    });

    return { success: true, value: productName };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-lang', async() => {
   try {
    const regKey = new WinReg({
      hive: WinReg.HKCU, // CHANGED: Use HKEY_CURRENT_USER
      key:  '\\Software\\Tune\\tune', // CHANGED: The specific key path
    });

    const locale = await new Promise((resolve, reject) => {
      // CHANGED: Get the 'InstallPath' value
      regKey.get('locale', (err, item) => {
        if (err) {
          // This error often means the key or value doesn't exist
          return reject(new Error('Could not find locale. Is the software installed?'));
        }
        resolve(item.value);
      });
    });
    return { success: true, value: locale };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
})

ipcMain.handle('write-lang', async (event, newLocale) => {
  // 1. Basic validation
  if (!newLocale || typeof newLocale !== 'string') {
    return { success: false, error: 'Invalid locale provided. Must be a non-empty string.' };
  }

  try {
    const regKey = new WinReg({
      hive: WinReg.HKCU,
      key: '\\Software\\Tune\\tune',
    });

    // 2. Use a Promise to wrap the 'set' callback
    await new Promise((resolve, reject) => {
      // Use regKey.set(name, type, value, callback)
      regKey.set('locale', WinReg.REG_SZ, newLocale, (err) => {
        if (err) {
          // This could fail due to permissions or if the key doesn't exist
          return reject(new Error(`Failed to write locale: ${err.message}`));
        }
        // Success
        resolve();
      });
    });

    // 3. Return a success object
    return { success: true, value: newLocale };

  } catch (error) {
    // 4. Catch any errors from the promise or instantiation
    console.error(error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-eq', async (event, newEq) => {
  // 1. Basic validation
  if (!newEq || typeof newEq !== 'string') {
    return { success: false, error: 'Invalid locale provided. Must be a non-empty string.' };
  }

  try {
    const regKey = new WinReg({
      hive: WinReg.HKCU,
      key: '\\Software\\Tune\\tune',
    });

    // 2. Use a Promise to wrap the 'set' callback
    await new Promise((resolve, reject) => {
      // Use regKey.set(name, type, value, callback)
      regKey.set('eq', WinReg.REG_SZ, newEq, (err) => {
        if (err) {
          // This could fail due to permissions or if the key doesn't exist
          return reject(new Error(`Failed to write locale: ${err.message}`));
        }
        // Success
        resolve();
      });
    });

    // 3. Return a success object
    return { success: true, value: newEq };

  } catch (error) {
    // 4. Catch any errors from the promise or instantiation
    console.error(error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-eq', async() => {
   try {
    const regKey = new WinReg({
      hive: WinReg.HKCU, // CHANGED: Use HKEY_CURRENT_USER
      key:  '\\Software\\Tune\\tune', // CHANGED: The specific key path
    });

    const eq = await new Promise((resolve, reject) => {
      // CHANGED: Get the 'InstallPath' value
      regKey.get('eq', (err, item) => {
        if (err) {
          // This error often means the key or value doesn't exist
          return reject(new Error('Could not find eq. Is the software installed?'));
        }
        resolve(item.value);
      });
    });
    return { success: true, value: eq };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
})

ipcMain.handle('get-tune-install-path', async () => {
  try {
    const regKey = new WinReg({
      hive: WinReg.HKCU, // CHANGED: Use HKEY_CURRENT_USER
      key:  '\\Software\\Tune\\tune', // CHANGED: The specific key path
    });

    const installPath = await new Promise((resolve, reject) => {
      // CHANGED: Get the 'InstallPath' value
      regKey.get('InstallPath', (err, item) => {
        if (err) {
          // This error often means the key or value doesn't exist
          return reject(new Error('Could not find InstallPath. Is the software installed?'));
        }
        resolve(item.value);
      });
    });

    return { success: true, value: installPath };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
});

// ------------------ Launch Detached ------------------
ipcMain.handle('launch-app-detached', async (event, appPath: string) => {
  try {
    const child = spawn(appPath, [], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
});

// ------------------ Check if Service Running ------------------
// Option 1: Try IPC connect (if you have a port)
// Option 2: Check mutex file
ipcMain.handle('check-service-running', async () => {
  try {
    // Example using a TCP port your C++ service listens on
    const PORT = 6767;
    return await new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      let finished = false;

      socket.setTimeout(1000);
      socket.on('connect', () => {
        finished = true;
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        if (!finished) resolve(false);
      });
      socket.on('timeout', () => {
        if (!finished) resolve(false);
      });
      socket.connect(PORT, '127.0.0.1');
    });
  } catch {
    return false;
  }
});

app.on('ready', () => {
// globalShortcut.register('Control+Shift+I', () => {
//         // When the user presses Ctrl + Shift + I, this function will get called
//         // You can modify this function to do other things, but if you just want
//         // to disable the shortcut, you can just return false
//         return false;
//     });
  
});


ipcMain.handle("load-locale-data", async (_, locale: string) => {
  try {
    const filePath = path.join(__dirname, "locales", `${locale}.json`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      return { success: true, data: JSON.parse(data) };
    }

    console.log(`Locale file for '${locale}' not found, falling back to English.`);

    // fallback to English
    const enPath = path.join(__dirname, "locales", "en.json");
    const enData = fs.readFileSync(enPath, "utf8");
    return { success: true, data: JSON.parse(enData) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});


 ipcMain.on('close-window', () => {
    app.quit();
  });

    ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });

  // Handler for the MAXIMIZE/RESTORE button
  ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

ipcMain.on("app-restart", () => {
  console.log("Restarting app due to WebSocket failure...");

  setTimeout(() => {
    app.relaunch();
    app.exit(0);
  }, 500);
});