import React from 'react';

// Define a new type that extends React's CSSProperties to include our custom property.
type CustomCssProperties = React.CSSProperties & { WebkitAppRegion?: 'drag' | 'no-drag' };

// Define the shape of the API exposed by the preload script
interface ElectronAPI {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

const TitleBar = () => {
    const handleMinimize = () => window.electronAPI?.minimize();
    const handleMaximize = () => window.electronAPI?.maximize();
    const handleClose = () => window.electronAPI?.close();

    return (
        <div style={styles.titleBarContainer}>
            <div style={styles.titleBar}>
                <div style={styles.draggableRegion}>
                    <span style={styles.title}>tune</span>
                </div>
                <div style={styles.windowControls}>
                    <button style={styles.controlButton} onClick={handleMinimize}>—</button>
                    <button style={styles.controlButton} onClick={handleMaximize}>☐</button>
                    <button style={{ ...styles.controlButton, ...styles.closeButton }} onClick={handleClose}>✕</button>
                </div>
            </div>
        </div>
    );
};

// --- STYLES ---

const styles: { [key: string]: CustomCssProperties } = {
    titleBarContainer: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        paddingTop: '1px',
        zIndex: 9999,
    },
    titleBar: {
        height: '32px',
        backgroundColor: '#101212',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    draggableRegion: {
        WebkitAppRegion: 'drag',
        flexGrow: 1,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
    },
    title: {
        color: '#96989c',
        fontSize: '13px',
        paddingLeft: '12px',
    },
    windowControls: {
        display: 'flex',
        WebkitAppRegion: 'no-drag',
    },
    controlButton: {
        width: '46px',
        height: '32px',
        border: 'none',
        backgroundColor: 'transparent',
        color: '#96989c',
        fontSize: '16px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {}
};

export default TitleBar;

