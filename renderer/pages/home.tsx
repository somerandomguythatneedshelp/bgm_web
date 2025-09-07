'use client';

import React, { useState, useEffect, useRef } from 'react';
import TitleBar from "./components/Titlebar";

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

    useEffect(() => {
        if (!lyrics || lyrics.length === 0) return;
        
        // **THE FIX**: Iterate forward from the start of the song to find the current line.
        let newIndex = -1;
        for (let i = 0; i < lyrics.length; i++) {
            if (currentTime >= lyrics[i].time) {
                newIndex = i;
            } else {
                // Since the array is sorted by time, we can stop early.
                break; 
            }
        }

        if (newIndex !== activeLineIndex) {
            setActiveLineIndex(newIndex);
        }
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
        <div ref={scrollContainerRef} className="h-full overflow-y-auto text-center p-4 scrollbar-hide">
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
    );
};

const MusicPlayerUI = ({ trackInfo, onSearch, isPlaying, onTogglePlayPause }) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [showLyrics, setShowLyrics] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [lyrics, setLyrics] = useState([]);

    const {
        title = "...",
        artist = "...",
        album = "...",
        coverArtUrl = "",
        song_length_sec = 0,
        lyrics: rawLyrics = ""
    } = trackInfo || {};

    useEffect(() => {
        if (rawLyrics) {
            try {
                const parsedData = JSON.parse(rawLyrics);
                if (!Array.isArray(parsedData)) {
                    setLyrics([]);
                    return;
                }
                
                // **THE FIX**: Correct logic to group words into lines/verses
                const lines = [];
                let currentLine = { time: 0, text: '' };

                parsedData.forEach((wordData, index) => {
                    const word = wordData.word || '';
                    const startTime = wordData.start || 0;

                    if (word.trim().length === 0) return;

                    const isCapitalized = word[0] >= 'A' && word[0] <= 'Z';
                    if (index > 0 && isCapitalized) {
                        if (currentLine.text) lines.push(currentLine);
                        currentLine = { time: startTime, text: word };
                    } else {
                        if (currentLine.text === '') {
                             currentLine = { time: startTime, text: word };
                        } else {
                            currentLine.text += ` ${word}`;
                        }
                    }
                });
                
                if (currentLine.text) lines.push(currentLine);
                setLyrics(lines);
                
            } catch (e) {
                setLyrics([]);
            }
        } else {
            setLyrics([]);
        }
    }, [rawLyrics]);

    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentTime((prev) => (prev < song_length_sec ? prev + 1 : 0));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, song_length_sec]);

    const formatTime = (seconds) => {
        const totalSeconds = Math.floor(seconds);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="w-full flex flex-col items-center">
            {/* **THE FIX**: This outer container handles the layout */}
            <div className="w-full max-w-7xl flex items-center justify-center gap-8">

                {/* Player Card: Fixed size, moves with a smooth transition */}
                <div className={`transition-transform duration-700 ease-in-out ${showLyrics ? '-translate-x-1/4' : ''}`}>
                    <div className="w-full max-w-2xl bg-black/25 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl flex flex-col md:flex-row p-6 gap-6 items-center">
                        <img
                            src={coverArtUrl}
                            alt="Current Track"
                            className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-lg shadow-lg flex-shrink-0"
                        />
                        <div className="flex flex-col flex-1 justify-center w-full h-full">
                           <div className="text-center md:text-left">
                                <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{title}</h2>
                                <p className="text-lg md:text-xl text-gray-200 mt-1 drop-shadow-md">{artist}</p>
                                <p className="text-md text-gray-300 drop-shadow-md">{album}</p>
                            </div>
                            <div className="mt-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-white/80 w-10 text-center">{formatTime(currentTime)}</span>
                                    <div className="flex-1 bg-white/10 rounded-full h-1.5 group">
                                        <div className="bg-white h-full rounded-full relative" style={{ width: `${(currentTime / song_length_sec) * 100}%` }} />
                                    </div>
                                    <span className="text-xs text-white/80 w-10 text-center">{formatTime(song_length_sec)}</span>
                                </div>
                                <div className="mt-4 flex items-center justify-between gap-4">
                                    <button onClick={() => setIsLiked(!isLiked)} className="p-2 text-gray-400 hover:text-white"><svg className={`w-6 h-6 ${isLiked ? 'text-purple-500' : ''}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg></button>
                                    <div className="flex items-center gap-4">
                                        <button className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg></button>
                                        <button onClick={onTogglePlayPause} className="p-5 rounded-full bg-white text-black hover:scale-105 shadow-lg hover:shadow-purple-500/40 transition"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d={isPlaying ? "M6 19h4V5H6v14zm8-14v14h4V5h-4z" : "M8 5v14l11-7z"} /></svg></button>
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

                {/* Lyrics Panel */}
                <div className={`transition-all duration-700 ease-in-out w-full md:w-1/2 flex-shrink-0 ${showLyrics ? 'opacity-100' : 'opacity-0 w-0'}`}>
                    <div className="h-96 bg-black/25 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl">
                        <LyricsPlayer lyrics={lyrics} currentTime={currentTime} />
                    </div>
                </div>
            </div>

            <div className="w-full max-w-5xl">
                <SearchBar onSearch={onSearch} />
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {["Recently Played", "Your Library", "Discover"].map((action, i) => (
                        <button key={action} className="p-4 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/30 text-left">
                            <div className="text-white font-medium">{action}</div>
                            <div className="text-gray-300 text-sm mt-1">{["Jump back in", "Made for you", "New releases"][i]}</div>
                        </button>
                    ))}
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
                    className="w-full p-4 pl-12 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
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
                            className="w-12 h-14 text-center text-2xl font-bold rounded-md border border-gray-700 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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

export default function HomePage() {
    const [trackInfo, setTrackInfo] = useState(null);
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

                    if (data.lyricsUrl) {
                    try {
                        const parsedLyrics = JSON.parse(data.lyricsUrl);
                        setLyrics(parsedLyrics);
                    } catch (err) {
                        console.error("Failed to parse lyrics JSON", err);
                        setLyrics(null);
                    }
                }

                } else if (data.type === "playback_status") {
                    setIsPlaying(data.isPlaying); 
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
                } 
            }
        };

        return () => socket.close();
    }, []);

    const handleSearchSubmit = (query: string) => {
        console.log("Sending search query:", query);
        // We format the message with the "Search: " prefix for the C++ backend
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
                    <input type="email" autoComplete="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                )}
                <input type="text" autoComplete="username" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                
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
                    />
                    }
            </main>
            </div>
        </div>
    );
}