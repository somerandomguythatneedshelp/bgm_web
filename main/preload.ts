import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value)
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args)
    ipcRenderer.on(channel, subscription)

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
}

contextBridge.exposeInMainWorld('ipc', handler)

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),

  getRegistryValue: (keyPath) => ipcRenderer.invoke('get-registry-value', keyPath),
  getTuneInstallPath: () => ipcRenderer.invoke('get-tune-install-path'),
  launchApp: (filePath: string) => ipcRenderer.invoke('launch-application', filePath),
  launchAppDetached: (appPath: string) => ipcRenderer.invoke('launch-app-detached', appPath),
  isTuneServiceRunning: () => ipcRenderer.invoke('check-service-running'),
});


export type IpcHandler = typeof handler
