export {};

declare global {
  interface Window {
    electronAPI: {
      onMediaKey: (callback: (keyName: string) => void) => void;
    };
  }
}
