'use client';

import React, { useState, useEffect, useRef } from 'react';
import TitleBar from "./components/Titlebar";
import { GlobalKeyboardListener } from 'node-global-key-listener';

interface Track {
    songId: number;
    song_name: string;
    artist_name: string;
    album: string;
    coverArtUrl: string;
    lyrics?: string;
    song_length_sec: number;
}

interface Playlist {
  name: string;
  track_ids: number[];
  tracks?: Track[];
}

const AuthIcon = () => (
    <svg 
        width="32" 
        height="32" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="text-white"
    >
        <path 
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C10.34 12 9 10.66 9 9C9 7.34 10.34 6 12 6ZM12 20C9.33 20 5.5 18.67 5.5 16V15C5.5 13.62 9.33 13 12 13C14.67 13 18.5 13.62 18.5 15V16C18.5 18.67 14.67 20 12 20Z" 
            fill="currentColor" 
        />
    </svg>
);

const LyricsPlayer = ({ lyrics, currentTime }) => {
    const [activeLineIndex, setActiveLineIndex] = useState(-1);
    const scrollContainerRef = useRef(null);

    const customScrollbarStyles = `
        .scrollbar-custom::-webkit-scrollbar { width: 8px; }
        .scrollbar-custom::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-custom::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.2); border-radius: 4px; }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover { background-color: rgba(255, 255, 255, 0.4); }
    `;

    useEffect(() => {
        if (!lyrics || lyrics.length === 0) return;
        
        let newIndex = -1;
        for (let i = 0; i < lyrics.length; i++) {
            if (currentTime >= lyrics[i].time) {
                newIndex = i;
            } else {
                break; 
            }
        }
        if (newIndex !== activeLineIndex) setActiveLineIndex(newIndex);
    }, [currentTime, lyrics, activeLineIndex]);

    useEffect(() => {
        if (activeLineIndex === -1 || !scrollContainerRef.current) return;
        
        const activeLineElement = scrollContainerRef.current.children[activeLineIndex];
        if (activeLineElement) {
            const containerHeight = scrollContainerRef.current.offsetHeight;
            const lineTop = activeLineElement.offsetTop;
            const lineHeight = activeLineElement.offsetHeight;
            
            scrollContainerRef.current.scrollTo({
                top: lineTop - containerHeight / 2 + lineHeight / 2,
                behavior: 'smooth'
            });
        }
    }, [activeLineIndex]);

    if (!lyrics || lyrics.length === 0) {
        return <div className="flex items-center justify-center h-full text-center text-gray-400">No lyrics available.</div>;
    }

    return (
        <>
            <style>{customScrollbarStyles}</style>
            <div ref={scrollContainerRef} className="h-full overflow-y-auto text-center p-4 scrollbar-custom">
                {lyrics.map((line, index) => {
                    const isActive = index === activeLineIndex;
                    const isPast = index < activeLineIndex;
                    return (
                        <p key={index} className={`transition-all duration-300 text-2xl p-2 font-semibold ${isActive ? 'text-white scale-105' : 'scale-100'} ${isPast ? 'text-gray-500' : 'text-gray-400'}`}>
                            {line.text}
                        </p>
                    );
                })}
            </div>
        </>
    );
};

const MusicPlayerUI = ({ trackInfo, onSearch, isPlaying, onTogglePlayPause, currentTime, setCurrentTime, onShowPlaylists }) => {
    const [showLyrics, setShowLyrics] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [lyrics, setLyrics] = useState([]);

    const {
        song_name = "...",
        artist_name = "...",
        album = "...",
        coverArtUrl = "",
        song_length_sec = 0,
        lyrics: lyricsUrl = ""
    } = trackInfo || {};

        useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentTime((prev) => (prev < song_length_sec ? prev + 0.1 : 0));
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying, song_length_sec]);

    useEffect(() => {
        if (lyricsUrl) {
            try {
                const parsedData = JSON.parse(lyricsUrl);
                if (Array.isArray(parsedData)) {
                    setLyrics(parsedData);
                } else {
                    setLyrics([]);
                }
            } catch (e) {
                setLyrics([]);
            }
        } else {
            setLyrics([]);
        }
    }, [lyricsUrl]);

    const formatTime = (seconds) => {
        const totalSeconds = Math.floor(seconds);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full max-w-7xl flex items-center justify-center gap-8 relative h-[24rem]">

                {/* Player Card: Translates left, but its container stays centered */}
                <div className={`transition-transform duration-700 ease-in-out ${showLyrics ? 'md:-translate-x-1/2' : 'md:translate-x-0'}`}>
                    {/* **THE FIX**: Changed max-w-xl to max-w-2xl */}
                    <div className="w-full max-w-2xl bg-black/25 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl flex flex-col md:flex-row p-6 gap-6 items-center">
                        <img
                            src={coverArtUrl}
                            alt="Current Track"
                            className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-lg shadow-lg flex-shrink-0"
                        />
                        <div className="flex flex-col flex-1 justify-center w-full h-full">
                           <div className="text-center md:text-left">
                                <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{song_name}</h2>
                                <p className="text-lg md:text-xl text-gray-200 mt-1 drop-shadow-md">{artist_name}</p>
                                <p className="text-md text-gray-300 drop-shadow-md">{album}</p>
                            </div>
                            <div className="mt-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-white/80 w-10 text-center">{formatTime(currentTime)}</span>
                                    <div className="flex-1 bg-white/10 rounded-full h-1.5 group"><div className="bg-white h-full rounded-full" style={{ width: `${(currentTime / song_length_sec) * 100}%` }} /></div>
                                    <span className="text-xs text-white/80 w-10 text-center">{formatTime(song_length_sec)}</span>
                                </div>
                                <div className="mt-4 flex items-center justify-between gap-4">
                                    <button onClick={() => setIsLiked(!isLiked)} className="p-2 text-gray-400 hover:text-white"><svg className={`w-6 h-6 ${isLiked ? 'text-purple-500' : ''}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg></button>
                                    <div className="flex items-center gap-4">
                                        <button className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg></button>
                                        <button onClick={onTogglePlayPause} className="p-5 rounded-full bg-white text-gray-900 hover:scale-105 shadow-lg hover:shadow-purple-500/40 transition"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d={isPlaying ? "M6 19h4V5H6v14zm8-14v14h4V5h-4z" : "M8 5v14l11-7z"} /></svg></button>
                                        <button className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg></button>
                                    </div>
                                    <button onClick={() => setShowLyrics(!showLyrics)} className={`p-2 ${showLyrics ? 'text-purple-400' : 'text-gray-400'} hover:text-white`}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`absolute right-0 transition-all duration-700 ease-in-out w-full md:w-1/2 flex-shrink-0 ${showLyrics ? 'opacity-100' : 'opacity-0 -z-10'}`}>
                    <div className="h-[22rem] bg-black/25 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl">
                        <LyricsPlayer lyrics={lyrics} currentTime={currentTime} />
                    </div>
                </div>
            </div>

            <div className="w-full max-w-5xl">
                <SearchBar onSearch={onSearch} />
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={onShowPlaylists} className="p-4 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/30 text-left">
                        <div className="text-white font-medium">Your Playlists</div>
                        <div className="text-gray-300 text-sm mt-1">View and manage your playlists</div>
                    </button>
                    <button className="p-4 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/30 text-left">
                        <div className="text-white font-medium">Recently Played</div>
                        <div className="text-gray-300 text-sm mt-1">Jump back in</div>
                    </button>
                    <button className="p-4 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/30 text-left">
                        <div className="text-white font-medium">Discover</div>
                        <div className="text-gray-300 text-sm mt-1">New releases</div>
                    </button>
                </div>
            </div>
        </div>
    );
};

const SearchBar = ({ onSearch }) => {
    const [query, setQuery] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
            setQuery(""); // Clear after searching
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a song or artist..."
                    className="w-full p-4 pl-12 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </div>
        </form>
    );
};

// A component to display password requirements and their validation status
const PasswordStrengthIndicator = ({ password }) => {
    const checks = {
        length: password.length >= 8,
        number: /\d/.test(password),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
    };

    const Requirement = ({ label, met }) => (
        <li className={`text-xs ${met ? 'text-green-400' : 'text-gray-400'} transition-colors duration-300`}>
            {met ? '✓' : '○'} {label}
        </li>
    );

    return (
        <ul className="space-y-1 text-left mt-4 p-4 bg-[#2a2a2a] rounded-md">
            <Requirement label="Minimum 8 characters" met={checks.length} />
            <Requirement label="Contains at least 1 number" met={checks.number} />
            <Requirement label="Contains at least 1 special character" met={checks.specialChar} />
            <Requirement label="Contains at least 1 uppercase letter" met={checks.uppercase} />
            <Requirement label="Contains at least 1 lowercase letter" met={checks.lowercase} />
        </ul>
    );
};

const VerificationCodeForm = ({ onVerify, email, errorText }) => {
    const [code, setCode] = useState(Array(6).fill(""));
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const { value } = e.target;
        if (!/^[0-9]$/.test(value) && value !== "") return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Move to next input if a digit is entered
        if (value && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        // Move to previous input on backspace if current is empty
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim().slice(0, 6);
        if (/^\d{6}$/.test(pastedData)) {
            const newCode = pastedData.split('');
            setCode(newCode);
            inputsRef.current[5]?.focus();
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const finalCode = code.join('');
        if (finalCode.length === 6) {
            onVerify(finalCode);
        }
    };

    return (
        <div className="w-full max-w-sm rounded-xl bg-[#1c1c1c] p-8 shadow-lg text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
            <p className="text-sm text-gray-400 mt-2">We've sent a 6-digit code to {email}.</p>
            <p className="text-sm text-gray-400">The code expires shortly, so please enter it soon.</p>

            <span className="text-sm" style={{ color: '#cf7474ff' }}>{errorText}</span>
            
            <form onSubmit={handleSubmit}>
                <div className="flex justify-center gap-2 my-8" onPaste={handlePaste}>
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            ref={el => { inputsRef.current[index] = el; }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleInputChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className="w-12 h-14 text-center text-2xl font-bold rounded-md border border-gray-700 bg-transparent text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    ))}
                </div>
                <button type="submit" className="w-full rounded-md bg-purple-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700">
                    Verify
                </button>
            </form>
        </div>
    );
};

const PlaylistsUI = ({ playlists, currentTrack, sendMessage, onBack, onGetPlaylistDetails }) => {
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [showAddSong, setShowAddSong] = useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);

    const handleCreatePlaylist = () => {
        if (newPlaylistName.trim()) {
            sendMessage(`CreatePlaylist: ${newPlaylistName.trim()}`);
            setNewPlaylistName('');
        }
    };

    const handleAddTrackToPlaylist = (playlistName: string) => {
        if (currentTrack && typeof currentTrack.songId === 'number') {
      sendMessage(`AddSongToPlaylist: ${playlistName}|${currentTrack.songId}`);
    } else {
      console.error("Cannot add to playlist: Invalid songId.", currentTrack);
    }
        setShowAddSong(false);
    };

    const handleRemoveTrack = (playlistName: string, songId: number) => {
        sendMessage(`RemoveSongFromPlaylist: ${playlistName}|${songId}`);
    };
    
    const handlePlayPlaylist = (name: string) => {
        sendMessage(`PlayPlaylist: ${name}`);
    };
    
    const handleDeletePlaylist = (name: string) => {
        if (window.confirm(`Are you sure you want to delete the playlist "${name}"?`)) {
            sendMessage(`DeletePlaylist: ${name}`);
        }
    };

    const handleSelectPlaylist = (name: string) => {
    // If it's already selected, collapse it.
    if (selectedPlaylist === name) {
      setSelectedPlaylist(null);
      return;
    }

    setSelectedPlaylist(name);
    const playlist = playlists[name];
    // If the detailed tracks for this playlist haven't been loaded yet, request them.
    if (!playlist.tracks || playlist.tracks.length === 0) {
      onGetPlaylistDetails(name);
    }
  };

    return (
        <div className="w-full max-w-5xl h-[32rem] bg-black/25 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl flex flex-col p-6 text-white">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-3xl font-bold">Your Playlists</h1>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* --- Add to Playlist Dropdown --- */}
            {currentTrack && (
                <div className="relative mb-4 text-left">
                    <button onClick={() => setShowAddSong(!showAddSong)} className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" /></svg>
                        Add '{currentTrack.song_name}' to Playlist
                    </button>
                    {showAddSong && (
                        <div className="absolute top-full left-0 mt-2 w-56 rounded-md shadow-lg bg-[#1c1c1c] ring-1 ring-white/10">
                            {Object.keys(playlists).map(name => (
                                <button key={name} onClick={() => handleAddTrackToPlaylist(name)} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10">
                                    {name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            <div className="flex-grow overflow-y-auto pr-2 scrollbar-custom">
                {Object.keys(playlists).length === 0 ? (
                    <p className="text-gray-400 text-center mt-8">You haven't created any playlists yet.</p>
                ) : (
                    Object.entries(playlists).map(([name, tracks]) => (
                        <div key={name} className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-semibold">{name}</h3>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handlePlayPlaylist(name)} className="p-2 rounded-full hover:bg-white/10" title="Play Playlist">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4.018 15.132A1 1 0 013 14.218V5.781a1 1 0 011.627-.781l8.438 4.219a1 1 0 010 1.562l-8.438 4.219z" /></svg>
                                    </button>
                                    <button onClick={() => handleDeletePlaylist(name)} className="p-2 rounded-full hover:bg-white/10 text-red-400" title="Delete Playlist">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            </div>
                            <ul className="space-y-2">
                                {(tracks as Track[]).map((track, index) => (
                                    <li key={`${track.songId}-${index}`} className="flex items-center justify-between p-2 rounded-md hover:bg-white/5">
                                        <span>{track.song_name} - <i className="text-gray-400">{track.artist_name}</i></span>
                                        <button onClick={() => handleRemoveTrack(name, currentTrack.songId)} className="p-1 rounded-full hover:bg-white/10 text-gray-500 hover:text-white" title="Remove song">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>
            
            <div className="mt-auto pt-4 border-t border-white/10 flex-shrink-0 flex gap-2">
                <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="New playlist name..."
                    className="flex-grow p-2 rounded-md bg-black/30 border border-white/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button onClick={handleCreatePlaylist} className="p-2 rounded-md bg-purple-600 hover:bg-purple-700">Create</button>
            </div>
        </div>
    );
};

export default function HomePage() {
    const [trackInfo, setTrackInfo] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [song_length_sec, setSongLength] = useState(0);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [password, setPassword] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [uiState, setUiState] = useState('auth'); 
    const ws = useRef<WebSocket | null>(null);
    const [lyrics, setLyrics] = useState(null);
    const [verifyError, setVerifyError] = useState("");
    const [playlists, setPlaylists] = useState<Record<string, Track[]>>({});

    const handleGetPlaylistDetails = (playlistName: string) => {
    sendMessage(`GetPlaylistDetails: ${playlistName}`);
  };

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:6767");
        ws.current = socket;

        socket.onopen = () => console.log("Connected to C++ WebSocket");
        socket.onclose = () => console.log("Connection closed");

        socket.onmessage = (event) => {
            console.log("Message from C++:", event.data);
            try {
                const data = JSON.parse(event.data);
                if (data.type === "track_update") {
                    setTrackInfo(data);
                    setCurrentTime(0);
                    if (data.lyrics) {
                    try {
                        const parsedLyrics = JSON.parse(data.lyrics);
                        setLyrics(parsedLyrics);
                    } catch (err) {
                        console.error("Failed to parse lyrics JSON", err);
                        setLyrics(null);
                    }
                }

                } else if (data.type === "playback_status") {
                    setIsPlaying(data.isPlaying); 
                } else if (data.type === "playlists_update") { // <-- HANDLE NEW MESSAGE
                    setPlaylists(data.playlists || {});
                }
            } catch (e) {
                // It's not a JSON message, handle as plain text
                if (event.data === "emailconfirmation") {
                    setUiState('verify'); 
                    setStatusMessage(""); //clear
                } else if (event.data === "emailalreadyexists") {
                    setVerifyError("An account with this email already exists.");
                } else if (event.data === "invalidconfirmationcode") {
                    setVerifyError("The verification code is incorrect. Please try again.");
                } else if (event.data === "useralreadyexists") {
                    setVerifyError("Username already taken. Please choose another.");
                } else if (event.data === "userauthenticated") {
                    setUiState('home');
                    setVerifyError("");
                    setStatusMessage("");
                } else if (event.data === "bluetooth_play_pause_shit") {
                    handleTogglePlayPause();
                }
            }
        };

        return () => socket.close();
    }, []);

    const handleSearchSubmit = (query: string) => {
        console.log("Sending search query:", query);
        sendCreds(`Search: ${query}`);
    };

    const sendMessage = (payload: string) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(payload);
        } else {
            console.log("WebSocket not connected");
        }
    };

    const handleTogglePlayPause = () => {
        sendMessage("toggle_play_pause");
    };

    const validatePassword = () => {
        const checks = {
            length: password.length >= 8,
            number: /\d/.test(password),
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
        };
        return Object.values(checks).every(Boolean);
    };

    const sendCreds = (payload: string) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(payload);
        } else {
            console.log("WebSocket not connected");
            setStatusMessage("Error: Not connected to the server.");
        }
    };

    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isRegistering) {
            if (!validatePassword()) {
                setStatusMessage("Password does not meet all requirements.");
                return;
            }
            sendCreds(`Username: ${username} *Email: ${email} *Password: ${password}`);
        } else {
            sendCreds(`Username: ${username} *Password: ${password}`);
        }
    };

    const handleVerificationSubmit = (code: string) => {
        console.log("Sending verification code:", code);
        sendCreds(`Code: ${code}`);
    };

    const renderAuthForm = () => (
        <div className="w-full max-w-sm rounded-xl bg-[#1c1c1c] p-8 shadow-lg">
            <div className="flex flex-col items-center space-y-2 text-center mb-8">
                <AuthIcon />
                <h1 className="text-2xl font-semibold tracking-tight">{isRegistering ? 'Create an account' : 'Sign in'}</h1>
                <p className="text-sm text-gray-400">
                    {isRegistering ? 'Fill in the details below.' : 'Welcome back! Please sign in.'}
                </p>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
                {isRegistering && (
                    <input type="email" autoComplete="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                )}
                <input type="text" autoComplete="username" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                
                {isRegistering && <PasswordStrengthIndicator password={password} />}
                
                <button type="submit" className="w-full rounded-md bg-purple-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700">
                    {isRegistering ? 'Create Account' : 'Continue'}
                </button>
            </form>
            {statusMessage && <p className="mt-4 text-center text-sm text-red-400">{statusMessage}</p>}
            <div className="mt-6 text-center text-sm">
                <button onClick={() => { setIsRegistering(!isRegistering); setStatusMessage(""); }} className="font-medium text-gray-400 hover:text-purple-400">
                    {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
            </div>
            <span className="text-s flex justify-center items-center pt-8" style={{ color: '#cf7474ff' }}>{verifyError}</span>
        </div>
    );

    const backgroundStyle = {
        backgroundImage: trackInfo?.coverArtUrl ? `url(${trackInfo.coverArtUrl})` : 'linear-gradient(135deg, #151516ff 0%, #1f1e20ff 100%)',
    };

    return (
        <div className="relative h-screen overflow-hidden font-sans text-white transition-all duration-1000">
            <div 
                style={backgroundStyle} 
                className="absolute inset-0 z-0 bg-cover bg-center filter blur-2xl scale-110 transition-all duration-1000" 
            />
            <div className="absolute inset-0 z-10 bg-black/50" />
            <div className="relative z-20 flex h-screen flex-col items-center justify-center p-4">
                <TitleBar />
                <main className="w-full flex flex-col items-center justify-center">
                {uiState === "playlists" && <PlaylistsUI 
                        playlists={playlists}
                        currentTrack={trackInfo}
                        sendMessage={sendMessage}
                        onBack={() => setUiState('home')}
                        onGetPlaylistDetails={handleGetPlaylistDetails}
                    />}
                {uiState === 'auth' && renderAuthForm()}
                {uiState === 'verify' && (
                    <VerificationCodeForm 
                        onVerify={handleVerificationSubmit} 
                        email={email} 
                        errorText={verifyError} 
                    />
                )}
                {uiState === 'home' && <MusicPlayerUI 
                    trackInfo={trackInfo}
                    onSearch={handleSearchSubmit}
                    isPlaying={isPlaying}
                    onTogglePlayPause={handleTogglePlayPause}
                    currentTime={currentTime}
                    setCurrentTime={setCurrentTime}
                    onShowPlaylists={() => setUiState('playlists')}
                    />
                    }
            </main>
            </div>
        </div>
    );
}