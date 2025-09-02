'use client';

import React, { useState, useEffect, useRef } from 'react';
import TitleBar from "./components/Titlebar";

const AuthIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C10.34 12 9 10.66 9 9C9 7.34 10.34 6 12 6ZM12 20C9.33 20 5.5 18.67 5.5 16V15C5.5 13.62 9.33 13 12 13C14.67 13 18.5 13.62 18.5 15V16C18.5 18.67 14.67 20 12 20Z" fill="currentColor" />
    </svg>
);

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


export default function HomePage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [uiState, setUiState] = useState('auth'); // 'auth' or 'verify'
    const ws = useRef<WebSocket | null>(null);
    const [verifyError, setVerifyError] = useState("");

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:6767");
        ws.current = socket;

        socket.onopen = () => console.log("Connected to C++ WebSocket");
        socket.onclose = () => console.log("Connection closed");

        socket.onmessage = (event) => {
            console.log("Message from C++:", event.data);
            if (event.data === "emailconfirmation") {
                setUiState('verify'); 
            } else if (event.data === "emailalreadyexists") {
                setVerifyError("An account with this email already exists.");
            } else if (event.data === "invalidconfirmationcode") {
                setVerifyError("The verification code is incorrect. Please try again.");
            } else if (event.data === "useralreadyexists") {
                setStatusMessage("Username already taken. Please choose another.");
            }
        };

        return () => socket.close();
    }, []);

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

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#111111] font-sans text-white">
            <TitleBar />
            <main className="flex flex-col items-center justify-center pt-[33px]" style={{ minHeight: '100vh' }}>
                {uiState === 'auth' 
                    ? renderAuthForm() 
                    : <VerificationCodeForm onVerify={handleVerificationSubmit} email={email} errorText={verifyError} />
                }
            </main>
        </div>
    );
}