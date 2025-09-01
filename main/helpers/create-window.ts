import {
  screen,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Rectangle,
} from 'electron'
import Store from 'electron-store'

export const createWindow = (
  windowName: string,
  options: BrowserWindowConstructorOptions
): BrowserWindow => {
  const key = 'window-state'
  const name = `window-state-${windowName}`
  const store = new Store<Rectangle>({ name })
  const defaultSize = {
    width: options.width,
    height: options.height,
    x: undefined,
    y: undefined,
  }
  let state = {}

  const restore = () => {
    const savedState = store.get(key, defaultSize)
    // Ensure x and y are present; if not, center the window
    if (typeof savedState.x !== 'number' || typeof savedState.y !== 'number') {
      const bounds = screen.getPrimaryDisplay().bounds
      return {
        ...savedState,
        x: (bounds.width - savedState.width) / 2,
        y: (bounds.height - savedState.height) / 2,
      }
    }
    return savedState
  }

  const getCurrentPosition = () => {
    const position = win.getPosition()
    const size = win.getSize()
    return {
      x: position[0],
      y: position[1],
      width: size[0],
      height: size[1],
    }
  }

  const windowWithinBounds = (windowState: Rectangle, bounds: Rectangle) => {
    return (
      windowState.x >= bounds.x &&
      windowState.y >= bounds.y &&
      windowState.x + windowState.width <= bounds.x + bounds.width &&
      windowState.y + windowState.height <= bounds.y + bounds.height
    )
  }

  const resetToDefaults = () => {
    const bounds = screen.getPrimaryDisplay().bounds
    return Object.assign({}, defaultSize, {
      x: (bounds.width - defaultSize.width) / 2,
      y: (bounds.height - defaultSize.height) / 2,
    })
  }

  const ensureVisibleOnSomeDisplay = (windowState: Rectangle) => {
    const visible = screen.getAllDisplays().some((display) => {
      return windowWithinBounds(windowState, display.bounds)
    })
    if (!visible) {
      return resetToDefaults()
    }
    return windowState
  }

  const saveState = () => {
    if (!win.isMinimized() && !win.isMaximized()) {
      Object.assign(state, getCurrentPosition())
    }
    store.set(key, state)
  }

  state = ensureVisibleOnSomeDisplay(restore())

  const win = new BrowserWindow({
    ...state,
    ...options,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      ...options.webPreferences,
    },
  })

  win.on('close', saveState)

  return win
}