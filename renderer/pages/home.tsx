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

const MusicPlayerUI = ({ trackInfo, onSearch }) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration] = useState(180) // 3 minutes
    const [showLyrics, setShowLyrics] = useState(false)

    const {
        title = "...",
        artist = "...",
        album = "...",
        year = "",
        coverArtUrl = ""
    } = trackInfo || {};

    useEffect(() => {
        let interval
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentTime((prev) => (prev < duration ? prev + 1 : 0))
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isPlaying, duration])

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    return (
        <div className="w-full max-w-4xl">
            <div className="relative overflow-hidden rounded-2xl">
                {/* Background Cover Art - same as album art */}
                <div className="absolute inset-0">
                    <img
                        src={coverArtUrl}
                        alt="Album Cover"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                </div>

                <div className="relative p-8">
                    <div className="flex items-center gap-6">
                        {/* Album Art - same as background with liquid glass effect */}
                        <div className="relative">
                            <img
                                src={coverArtUrl}
                                alt="Current Track"
                                className="w-24 h-24 rounded-lg shadow-lg"
                            />
                            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg border border-white/20" />
                        </div>

                        {/* Track Info */}
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{title}</h2>
                            <p className="text-gray-200 text-lg drop-shadow-md">{artist}</p>
                            <p className="text-gray-300 text-sm drop-shadow-md">{album}{year && ` (${year})`}</p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-4">
                            <button className="p-3 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 transition-all duration-200 border border-white/20">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="p-4 rounded-full bg-white/90 hover:bg-white transition-all duration-200 shadow-lg hover:scale-105 backdrop-blur-sm"
                            >
                                {isPlaying ? (
                                    <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                )}
                            </button>
                            <button className="p-3 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 transition-all duration-200 border border-white/20">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setShowLyrics(!showLyrics)}
                                className="p-3 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 transition-all duration-200 border border-white/20"
                            >
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6 flex items-center gap-3">
                        <span className="text-xs text-white drop-shadow-md w-10">{formatTime(currentTime)}</span>
                        <div className="flex-1 bg-black/30 backdrop-blur-sm rounded-full h-1 overflow-hidden border border-white/20">
                            <div
                                className="bg-white h-full transition-all duration-1000 ease-linear shadow-sm"
                                style={{ width: `${(currentTime / duration) * 100}%` }}
                            />
                        </div>
                        <span className="text-xs text-white drop-shadow-md w-10">{formatTime(duration)}</span>
                    </div>

                    <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${
                            showLyrics ? "max-h-96 opacity-100 mt-6" : "max-h-0 opacity-0"
                        }`}
                    >
                        <div className="p-6 rounded-xl bg-black backdrop-blur-md border border-white/20">
                            <h3 className="text-lg font-semibold text-white mb-4 drop-shadow-md">Lyrics</h3>
                            <div className="leading-relaxed space-y-2">
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SearchBar onSearch={onSearch} />

            <div className="mt-6 grid grid-cols-3 gap-4">
                {["Recently Played", "Your Library", "Discover"].map((action, index) => (
                    <button
                        key={action}
                        className="p-4 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/30 transition-all duration-200 text-left"
                    >
                        <div className="text-white font-medium drop-shadow-md">{action}</div>
                        <div className="text-gray-300 text-sm mt-1 drop-shadow-sm">
                            {index === 0 && "Jump back in"}
                            {index === 1 && "Made for you"}
                            {index === 2 && "New releases"}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}

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
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [uiState, setUiState] = useState('auth'); 
    const ws = useRef<WebSocket | null>(null);
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

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#111111] font-sans text-white">
            <TitleBar />
            <main className="flex flex-col items-center justify-center pt-[33px]" style={{ minHeight: '100vh' }}>
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
                    onSearch={handleSearchSubmit}/>}
            </main>
        </div>
    );
}