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

export default function HomePage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:6767");
    ws.current = socket;

    socket.onopen = () => {
      console.log("Connected to C++ WebSocket");
      socket.send("Attempt");
    };

    socket.onmessage = (event) => {
      console.log("Message from C++:", event.data);
      
    };

    socket.onclose = () => {
      console.log("Connection closed");
    };

    return () => {
      socket.close();
    };
  }, []);

  const SendSignInCreds = (username: string, password: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send("Username: " + username + " *Password: " + password);
    } else {
      console.log("WebSocket not connected");
    }
  }

  const SendSignUpCreds = (email: string, username: string, password: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send("Username: " + username + " *Email: " + email + " *Password: " + password);
    } else {
      console.log("WebSocket not connected");
    }
  }


    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
           // setStatusMessage("Cannot send: Not connected to the server.");
            return;
        }

        const action = isRegistering ? 'register' : 'login';
        
        if (!isRegistering) {
            SendSignInCreds(username, password);
        } else {
            SendSignUpCreds(email, username, password);
        }
    };


    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#111111] font-sans text-white">
            <TitleBar />
            <main
        className="flex flex-col items-center justify-center pt-[33px]"
        style={{ minHeight: '100vh' }}
      >
            <div className="w-full max-w-sm rounded-xl bg-[#1c1c1c] p-8 shadow-lg">
                <div className="flex flex-col items-center space-y-2 text-center mb-8">
                    <AuthIcon />
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {isRegistering ? 'Create an account' : 'Sign in'}
                    </h1>
                    <p className="text-sm text-gray-400">
                        {isRegistering
                            ? 'Fill in the details below to create your account.'
                            : 'Welcome back! Please sign in to continue.'}
                    </p>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                    {isRegistering && (
                        <input
                            type="email"
                            autoComplete="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                        />
                    )}
                    <input
                        type="text"
                        autoComplete="username"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    />
                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    />
                    <button
                        type="submit"
                        className="w-full rounded-md bg-purple-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                        {isRegistering ? 'Create Account' : 'Continue'}
                    </button>
                </form>

                {statusMessage && (
                    <p className="mt-4 text-center text-sm text-gray-300">{statusMessage}</p>
                )}

                <div className="mt-6 text-center text-sm">
                    <button
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setStatusMessage(""); // Clear status on toggle
                        }}
                        className="font-medium text-gray-400 hover:text-purple-400"
                    >
                        {isRegistering
                            ? 'Already have an account? Sign in'
                            : "Don't have an account? Sign up"}
                    </button>
                </div>
            </div>
            </main>
        </div>
    );
}


