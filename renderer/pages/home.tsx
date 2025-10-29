import React, { useState, useEffect, useRef } from "react";
import TitleBar from "./components/Titlebar/Titlebar";
import { motion, AnimatePresence } from "framer-motion";
import { parseStrToLocale, parseSRT, Track } from "./utils/Utils";
import { parse } from "path";
import MusicPlayerUI from "./components/MusicPlayer/MusicPlayer";
import PlaylistsUi from "./components/Playlists/PlaylistsUi";

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

interface LyricLine {
  time: number;
  text: string;
}

export default function HomePage() {
  const [trackInfo, setTrackInfo] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [uiState, setUiState] = useState("auth");
  const ws = useRef<WebSocket | null>(null);
  const [lyrics, setLyrics] = useState([]);
  const [verifyError, setVerifyError] = useState("");
  const timerRef = useRef(null);
  const syncInfoRef = useRef({ serverStartTime: 0, startPosition: 0 });
  const [playlists, setPlaylists] = useState<Record<string, Track[]>>({});

  const [emailPlaceholder, setEmailPlaceholder] = useState("Loading...");
  const [usernamePlaceholder, setUsernamePlaceholder] = useState("Loading...");
  const [passwordPlaceholder, setPasswordPlaceholder] = useState("Loading...");
  const [localeCreateAccount, setLocaleCreateAccount] = useState("Loading...");
  const [localeSignIn, setLocaleSignIn] = useState("Loading...");
  const [localeDetailsBelow, setLocaleDetailsBelow] = useState("Loading...");
  const [localeWelcome, setLocaleWelcome] = useState("Loading...");
  const [localeCreate, setLocaleCreate] = useState("Loading...");
  const [localeContinue, setLocaleContinue] = useState("Loading...");
  const [localeSignInWithAccount, setLocaleSignInWithAccount] = useState("Loading...");
  const [localeSignUpWithAccount, setLocaleSignUpWithAccount] = useState("Loading...");

  useEffect(() => {
    (async () => {
      const email = await parseStrToLocale("auth.enteremail");
      const username = await parseStrToLocale("auth.enterusername");
      const password = await parseStrToLocale("auth.enterpassword");

      setEmailPlaceholder(email);
      setUsernamePlaceholder(username);
      setPasswordPlaceholder(password);

      setLocaleCreateAccount(await parseStrToLocale("auth.createaccount"));
      setLocaleSignIn(await parseStrToLocale("auth.signin"));
      setLocaleDetailsBelow(await parseStrToLocale("auth.detailsbelow"));
      setLocaleWelcome(await parseStrToLocale("auth.welcome"));
      setLocaleCreate(await parseStrToLocale("create"));
      setLocaleContinue(await parseStrToLocale("continue"));
      setLocaleSignInWithAccount(await parseStrToLocale("auth.signinwithaccount"));
      setLocaleSignUpWithAccount(await parseStrToLocale("auth.signupwithaccount"));
    })();
  }, []);

  const sendMessage = (payload: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(payload);
    } else {
      console.log("WebSocket not connected");
    }
  };

  const handleGetPlaylists = (playlistName: string) => {
    sendMessage(`GetPlaylistDetails: ${playlistName}`);
  };

  const handleShowPlaylist = () => {
    sendMessage("RequestPlaylists");
    setUiState("playlists");
  };

  const handleTogglePlayPause = () => {
    sendMessage("toggle_play_pause");
  };

  async function TryLaunchServer() {
    setStatusMessage("Finding application...");

    // 1. Get install path from registry via preload
    const pathResult = await (window as any).electronAPI.getTuneInstallPath();
    if (!pathResult.success || !pathResult.value) {
      setStatusMessage(
        `Error: Could not find application path. ${pathResult.error}`
      );
      return false;
    }

    const servicePath = `${pathResult.value}\\Tune_Service.exe`;
    setStatusMessage(
      `Found at ${servicePath}. Checking if service is already running...`
    );

    // 2. Launch service if not running
    let isRunning = await (window as any).electronAPI.isTuneServiceRunning();
    if (!isRunning) {
      setStatusMessage("Service not running. Launching...");
      const launchResult = await (window as any).electronAPI.launchAppDetached(
        servicePath
      );
      if (!launchResult.success) {
        setStatusMessage(`Error launching service: ${launchResult.error}`);
        return false;
      }
    }

    setStatusMessage("Waiting for service to accept connections...");

    const maxWaitTime = 10000; // 30 seconds max
    const intervalMs = 1000; // 1 seconds
    const startTime = Date.now();
    let connected = false;

    while (!connected && Date.now() - startTime < maxWaitTime) {
      try {
        await new Promise<void>((resolve, reject) => {
          const testSocket = new WebSocket("ws://localhost:6767");
          testSocket.onopen = () => {
            testSocket.close();
            resolve();
          };
          testSocket.onerror = () => {
            testSocket.close();
            (window as any).electronAPI.restartApp();
            reject();
          };
        });
        connected = true;
      } catch {
        setStatusMessage("Service not ready yet, retrying...");
        await new Promise((res) => setTimeout(res, intervalMs));
      }
    }

    if (!connected) {
      setStatusMessage("Could not connect to the service in time.");
      return false;
    }

    setStatusMessage("Service is ready!");
    return true;
  }

  function onNextTrack() {
    console.log("[Debug] Next track button clicked");
    sendMessage("next_track");
  }

  function onPrevTrack() {
    console.log("[Debug] Previous track button clicked");
    sendMessage("prev_track");
  }

  useEffect(() => {
    const tick = () => {
      const { serverStartTime, startPosition } = syncInfoRef.current;
      if (serverStartTime > 0) {
        const elapsed = (Date.now() - serverStartTime) / 1000;
        setCurrentTime(startPosition + elapsed);
      }
    };

    if (isPlaying) {
      // Start a high-frequency timer for smooth UI updates
      timerRef.current = setInterval(tick, 100);
    } else {
      // Clear the timer when paused
      clearInterval(timerRef.current);
    }

    // Cleanup on component unmount
    return () => clearInterval(timerRef.current);
  }, [isPlaying]);

  useEffect(() => {
    let socket: WebSocket;

    async function initConnection() {
      const serviceReady = await TryLaunchServer();
      if (!serviceReady) return;

      socket = new WebSocket("ws://localhost:6767");
      ws.current = socket;

      socket.onopen = () => {
        console.log("Connected to WebSocket server");
        sendMessage("GiveMeCurrentSongDataNow");
      };

      socket.onclose = () => console.log("Connection closed");

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "playback_position") {
            console.log("[Debug] Received playback_position data:", data);
            setCurrentTime(data.position);
          }
          if (data.type === "lyics_update") {
            console.log("[Debug] Received lyics_update data:", data);
            const parsedLyrics = parseSRT(data.lyricsUrl);
            if (parsedLyrics && parsedLyrics.length > 0) {
              setLyrics(parsedLyrics);
            }
          }
          if (data.type === "track_update") {
            // [Debug Checkpoint]
            console.log("[Debug] Received track_update data:", data);
            setTrackInfo(data);
            setLyrics([]); // Clear previous lyrics
            syncInfoRef.current = {
              serverStartTime: data.serverStartTime,
              startPosition: data.startPosition || 0,
            };

            const elapsed = (Date.now() - data.serverStartTime) / 1000;
            setCurrentTime(data.startPosition + elapsed);
            setIsPlaying(true);

            setTimeout(() => {
              handleTogglePlayPause();
              handleTogglePlayPause();
            }, 670);
          } else if (data.type === "playback_status") {
            setIsPlaying(data.isPlaying);
            if (data.isPlaying) {
              // Resuming playback, re-sync the timer
              syncInfoRef.current = {
                serverStartTime: data.serverStartTime,
                startPosition: data.startPosition,
              };
            } else {
              // Paused, set the time to the exact final position
              setCurrentTime(data.position);
            }
          } else if (data.type === "playlists_update") {
            setPlaylists(data.playlists || {});
          } else if (
            data.type === "songupdatefromwhentheuserclosedfrontendapp"
          ) {
            // [Debug Checkpoint]
            console.log(
              "[Debug] Received songupdatefromwhentheuserclosedfrontendapp data:",
              data
            );
            setLyrics([]); // Clear previous lyrics
            setTrackInfo(data);
            setCurrentTime(Number(data.current_position.position));
            setIsPlaying(data.isPlaying);
            setTimeout(() => {
              handleTogglePlayPause();
              handleTogglePlayPause();
            }, 50);
            console.log(
              "[Debug] Current position:",
              data.current_position.position
            );
            if (data.lyricsUrl != "") {
              const parsedLyrics = parseSRT(data.lyricsUrl);
              if (parsedLyrics && parsedLyrics.length > 0) {
                setLyrics(parsedLyrics);
              }
            }
          }
        } catch (e) {
          if (event.data === "emailconfirmation") {
            setUiState("verify");
            setStatusMessage("");
          } else if (event.data === "emailalreadyexists") {
            setVerifyError("An account with this email already exists.");
          } else if (event.data === "invalidconfirmationcode") {
            setVerifyError(
              "The verification code is incorrect. Please try again."
            );
          } else if (event.data === "useralreadyexists") {
            setVerifyError("Username already taken. Please choose another.");
          } else if (event.data === "userauthenticated") {
            setUiState("home");
            setVerifyError("");
            setStatusMessage("");
          } else if (event.data === "bluetooth_play_pause_shit") {
            handleTogglePlayPause();
          }
        }
      };
    }

    initConnection();

    return () => {
      if (socket) socket.close();
    };
  }, []);

  const handleSearchSubmit = (query: string) => {
    sendCreds(`Search: ${query}`);
  };

  const validatePassword = () => {
    const checks = {
      length: password.length >= 8,
      number: /\d/.test(password),
    };
    return Object.values(checks).every(Boolean);
  };

  const sendCreds = (payload: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(payload);
    } else {
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
      sendCreds(
        `Username: ${username} *Email: ${email} *Password: ${password}`
      );
    } else {
      sendCreds(`Username: ${username} *Password: ${password}`);
    }
  };

  const handleVerificationSubmit = (code: string) => {
    sendCreds(`Code: ${code}`);
  };

  const PasswordStrengthIndicator = ({ password }) => {
    const checks = {
      length: password.length >= 8,
      number: /\d/.test(password),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
    };

    const Requirement = ({ label, met }) => (
      <li
        className={`text-xs ${
          met ? "text-green-400" : "text-gray-400"
        } transition-colors duration-300`}
      >
        {met ? "✓" : "○"} {label}
      </li>
    );

    return (
      <ul className="space-y-1 text-left mt-4 p-4 bg-[#2a2a2a] rounded-md">
        <Requirement label="Minimum 8 characters" met={checks.length} />
        <Requirement label="Contains at least 1 number" met={checks.number} />
      </ul>
    );
  };

  const VerificationCodeForm = ({ onVerify, email, errorText }) => {
    const [code, setCode] = useState(Array(6).fill(""));
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    const handleInputChange = (
      e: React.ChangeEvent<HTMLInputElement>,
      index: number
    ) => {
      const { value } = e.target;
      if (!/^[0-9]$/.test(value) && value !== "") return;
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      if (value && index < 5) {
        inputsRef.current[index + 1]?.focus();
      }
    };

    const handleKeyDown = (
      e: React.KeyboardEvent<HTMLInputElement>,
      index: number
    ) => {
      if (e.key === "Backspace" && !code[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").trim().slice(0, 6);
      if (/^\d{6}$/.test(pastedData)) {
        const newCode = pastedData.split("");
        setCode(newCode);
        inputsRef.current[5]?.focus();
      }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const finalCode = code.join("");
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

  const renderAuthForm = () => (
    <div className="w-full max-w-sm rounded-xl bg-[#1c1c1c] p-8 shadow-lg">
      <div className="flex flex-col items-center space-y-2 text-center mb-8">
        <AuthIcon />
        <h1 className="text-2xl font-semibold tracking-tight">
          {isRegistering
            ? localeCreateAccount
            : localeSignIn}
        </h1>
        <p className="text-sm text-gray-400">
          {isRegistering
            ? localeDetailsBelow
            : localeWelcome}
        </p>
      </div>
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {isRegistering && (
          <input
            type="email"
            autoComplete="email"
            placeholder={emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white-500"
          />
        )}
        <input
          type="text"
          autoComplete="username"
          placeholder={usernamePlaceholder}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white-500"
        />
        <input
          type="password"
          placeholder={passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white-500"
        />

        {isRegistering && <PasswordStrengthIndicator password={password} />}

        <button
          type="submit"
          className="w-full rounded-md bg-white-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-white-700"
        >
          {isRegistering
            ? localeCreate
            : localeContinue
            }
        </button>
      </form>
      {statusMessage && (
        <p className="mt-4 text-center text-sm text-red-400">
          {statusMessage}
        </p>
      )}
      <div className="mt-6 text-center text-sm">
        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            setStatusMessage("");
          }}
          className="font-medium text-gray-400 hover:text-white-400"
        >
          {isRegistering
            ? localeSignInWithAccount
            : localeSignUpWithAccount}
        </button>
      </div>
      <span
        className="text-s flex justify-center items-center pt-8"
        style={{ color: "#cf7474ff" }}
      >
        {verifyError}
      </span>
    </div>
  );

  const backgroundStyle = {
    backgroundImage: trackInfo?.coverArtUrl
      ? `url(${trackInfo.coverArtUrl})`
      : "linear-gradient(135deg, #151516ff 0%, #1f1e20ff 100%)",
  };

  return (
      <div className="relative h-screen overflow-hidden font-sans text-white transition-all duration-1000">
            <div 
                style={backgroundStyle} 
                className="absolute inset-0 z-0 bg-cover bg-center filter blur-2xl scale-110 transition-all duration-1000" 
            />
      <div className="absolute inset-0 z-10 bg-gradient-to-tr from-black/60 via-black/40 to-black/60 backdrop-brightness-75" />
      <div className="relative z-20 flex h-screen flex-col items-center justify-center p-4">
        <TitleBar />
        <main className="w-full flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {uiState === "playlists" && (
              <PlaylistsUi
                playlists={playlists}
                currentTrack={trackInfo}
                sendMessage={sendMessage}
                onBack={() => setUiState("home")}
                onGetPlaylistDetails={handleGetPlaylists}
              />
            )}
            {uiState === "auth" && renderAuthForm()}
            {uiState === "verify" && (
              <VerificationCodeForm
                onVerify={handleVerificationSubmit}
                email={email}
                errorText={verifyError}
              />
            )}
            {uiState === "home" && (
              <MusicPlayerUI
                trackInfo={trackInfo}
                onSearch={handleSearchSubmit}
                isPlaying={isPlaying}
                onTogglePlayPause={handleTogglePlayPause}
                currentTime={currentTime}
                onShowPlaylists={handleShowPlaylist}
                lyrics={lyrics}
                onNextTrack={onNextTrack}
                onPrevTrack={onPrevTrack}
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}