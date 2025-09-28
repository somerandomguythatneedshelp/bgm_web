'use client';

import React, { useState, useEffect, useRef } from 'react';
import TitleBar from "./components/Titlebar";
import { GlobalKeyboardListener } from 'node-global-key-listener';
import { motion, AnimatePresence } from 'framer-motion';
import { init } from 'next/dist/compiled/webpack/webpack';

interface Track {
    songId: number;
    song_name: string;
    artist_name: string;
    album: string;
    coverArtUrl: string;
    lyricsUrl?: string;
    song_length_sec: number;
}

interface Playlist {
  name: string;
  track_ids: number[];
  tracks?: Track[];
}

interface LyricLine {
  time: number
  text: string
}

interface LyricsPlayerProps {
  lyrics: LyricLine[]
  currentTime: number
  isPlaying?: boolean
  songId?: string | number 
}

const LyricsPlayer = ({ lyrics, currentTime, isPlaying = true, songId }: LyricsPlayerProps) => {
  const [activeLineIndex, setActiveLineIndex] = useState(-1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayLyrics, setDisplayLyrics] = useState(lyrics)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const prevSongIdRef = useRef(songId)

  const customScrollbarStyles = `
    .scrollbar-custom::-webkit-scrollbar { width: 6px; }
    .scrollbar-custom::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-custom::-webkit-scrollbar-thumb { 
      background: linear-gradient(to bottom, rgba(234, 231, 236, 0.3), rgba(165, 160, 170, 0.6)); 
      border-radius: 3px; 
      transition: all 0.3s ease;
    }
    .scrollbar-custom::-webkit-scrollbar-thumb:hover { 
      background: linear-gradient(to bottom, rgba(210, 205, 214, 0.5), rgba(121, 118, 124, 0.88)); 
    }
  `

  useEffect(() => {
    if (prevSongIdRef.current !== songId && prevSongIdRef.current !== undefined) {
      // Song changed - start transition
      setIsTransitioning(true)

      // Fade out current lyrics
      setTimeout(() => {
        setDisplayLyrics(lyrics)
        setActiveLineIndex(-1)

        // Fade back in with new lyrics
        setTimeout(() => {
          setIsTransitioning(false)
        }, 200) // Slightly longer fade in for smoother effect
      }, 400) // Longer fade out for smoother transition
    } else {
      // Same song or initial load
      setDisplayLyrics(lyrics)
    }

    prevSongIdRef.current = songId
  }, [lyrics, songId])

  useEffect(() => {
    if (!displayLyrics || displayLyrics.length === 0 || isTransitioning) return

    let newIndex = -1
    for (let i = 0; i < displayLyrics.length; i++) {
      if (currentTime >= displayLyrics[i].time) {
        newIndex = i
      } else {
        break
      }
    }
    if (newIndex !== activeLineIndex) setActiveLineIndex(newIndex)
  }, [currentTime, displayLyrics, activeLineIndex, isTransitioning])

  useEffect(() => {
    if (activeLineIndex === -1 || !scrollContainerRef.current || isTransitioning) return

    const activeLineElement = scrollContainerRef.current.children[activeLineIndex] as HTMLElement
    if (activeLineElement) {
      const containerHeight = scrollContainerRef.current.offsetHeight
      const lineTop = activeLineElement.offsetTop
      const lineHeight = activeLineElement.offsetHeight

      scrollContainerRef.current.scrollTo({
        top: lineTop - containerHeight / 2 + lineHeight / 2,
        behavior: "smooth",
      })
    }
  }, [activeLineIndex, isTransitioning])

  if (!displayLyrics || displayLyrics.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-full text-center text-gray-400 transition-all duration-500 ease-out ${
          isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        <div className="space-y-2">
          <svg className="w-12 h-12 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <p className="text-lg">No lyrics available</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{customScrollbarStyles}</style>
      <div
        ref={scrollContainerRef}
        className={`h-full overflow-y-auto text-center px-6 py-8 scrollbar-custom transition-all duration-500 ease-out ${
          isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
        } ${!isPlaying ? "opacity-60" : ""}`}
      >
        {displayLyrics.map((line, index) => {
          const isActive = index === activeLineIndex && !isTransitioning
          const isPast = index < activeLineIndex && !isTransitioning
          const isUpcoming = index > activeLineIndex && !isTransitioning

          return (
            <p
              key={`${songId}-${index}`}
              className={`transition-all duration-700 ease-out text-xl md:text-2xl py-3 px-2 font-medium leading-relaxed transform ${
                isActive ? "text-white scale-105 opacity-100 translate-y-0" : "scale-100 translate-y-0"
              } ${
                isPast
                  ? "text-gray-500 opacity-60"
                  : isUpcoming
                    ? "text-gray-400 opacity-40"
                    : "text-gray-400 opacity-70"
              }`}
              style={{
                filter: isActive ? "blur(0px)" : "blur(0.3px)",
                textShadow: isActive ? "0 0 30px rgba(33, 31, 36, 0.4), 0 0 60px rgba(54, 51, 51, 0.2)" : "none",
                background: isActive
                  ? "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(61, 54, 68, 0.05))"
                  : "transparent",
                borderRadius: isActive ? "12px" : "0px",
              }}
            >
              {line.text}
            </p>
          )
        })}
        <div className="h-32" />
      </div>
    </>
  )
}


const parseSRT = (srtText: string) => {
    if (!srtText) return [];

    const lines = srtText.split(/\r?\n/);
    const result = [];
    let i = 0;

    while (i < lines.length) {
        const indexLine = lines[i].trim();
        const timeLine = lines[i + 1]?.trim();
        const textLine = lines[i + 2]?.trim();

        if (!indexLine || !timeLine || !textLine) {
            i++;
            continue;
        }

        // Parse time
        const timeMatch = timeLine.match(/(\d+):(\d+):(\d+),(\d+)\s-->\s(\d+):(\d+):(\d+),(\d+)/);
        if (!timeMatch) {
            i += 3;
            continue;
        }

        const startTimeSec = 
            parseInt(timeMatch[1]) * 3600 +
            parseInt(timeMatch[2]) * 60 +
            parseInt(timeMatch[3]) +
            parseInt(timeMatch[4]) / 1000;

        result.push({
            time: startTimeSec,
            text: textLine
        });

        i += 4; // move to next block (usually 4 lines per SRT block)
    }

    return result;
};


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

const MusicPlayerUI = ({
  trackInfo,
  onSearch,
  isPlaying,
  onTogglePlayPause,
  currentTime,
  setCurrentTime,
  onShowPlaylists,
  lyrics,
}) => {
  const [showLyrics, setShowLyrics] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  // All variable names here match the JSON keys from C++
  const {
    song_name = "...",
    artist_name = "...",
    album = "...",
    coverArtUrl = "",
    song_length_sec = 0,
    songId = 0, // Added songId to match JSON
    lyrics: lyricsUrl = "",
  } = trackInfo || {}



  const formatTime = (seconds) => {
    const totalSeconds = Math.floor(seconds)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full flex flex-col items-center"
    >
      <div className="w-full max-w-7xl flex items-center justify-center gap-8 relative h-[26rem]">
        <div
          className={`transition-all duration-700 ease-out ${showLyrics ? "md:-translate-x-1/2" : "md:translate-x-0"}`}
        >
          <div className="w-full max-w-2xl bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row p-8 gap-8 items-center hover:bg-black/25 transition-all duration-500">
            <div className="relative group">
              <img
                src={coverArtUrl || "/placeholder.svg"}
                alt="Current Track"
                className="w-52 h-52 md:w-60 md:h-60 object-cover rounded-2xl shadow-2xl flex-shrink-0 transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-purple-500/20"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="flex flex-col flex-1 justify-center w-full h-full space-y-6">
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg leading-tight">{song_name}</h2>
                <p className="text-lg md:text-xl text-gray-200 drop-shadow-md font-medium">{artist_name}</p>
                <p className="text-base text-gray-300 drop-shadow-md">{album}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-white/80 w-12 text-center font-mono">{formatTime(currentTime)}</span>
                  <div className="flex-1 bg-white/10 rounded-full h-2 group cursor-pointer hover:h-2.5 transition-all duration-200">
                    <div
                      className="bg-gradient-to-r from-purple-400 to-purple-600 h-full rounded-full transition-all duration-300 shadow-lg shadow-purple-500/30"
                      style={{ width: `${(currentTime / song_length_sec) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-white/80 w-12 text-center font-mono">
                    {formatTime(song_length_sec)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-110"
                  >
                    <svg
                      className={`w-6 h-6 transition-colors duration-300 ${isLiked ? "text-purple-400 fill-current" : ""}`}
                      fill={isLiked ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
                      />
                    </svg>
                  </button>

                  <div className="flex items-center gap-6">
                    <button className="p-3 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                      </svg>
                    </button>

                    <button
                      onClick={onTogglePlayPause}
                      className="p-6 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 hover:scale-105 shadow-xl hover:shadow-purple-500/50 transition-all duration-300"
                    >
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d={isPlaying ? "M6 19h4V5H6v14zm8-14v14h4V5h-4z" : "M8 5v14l11-7z"} />
                      </svg>
                    </button>

                    <button className="p-3 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                      </svg>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowLyrics(!showLyrics)}
                    className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${showLyrics ? "text-purple-400 bg-purple-400/10" : "text-gray-400 hover:text-white hover:bg-white/10"}`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`absolute right-0 transition-all duration-700 ease-out w-full md:w-1/2 flex-shrink-0 ${showLyrics ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 -z-10"}`}
        >
          <div className="h-[24rem] bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <LyricsPlayer lyrics={lyrics} currentTime={currentTime} />
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl space-y-6">
        <SearchBar onSearch={onSearch} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={onShowPlaylists}
            className="group p-6 rounded-2xl bg-black/15 backdrop-blur-md border border-white/10 hover:bg-black/25 hover:border-white/20 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="text-white font-semibold text-lg group-hover:text-purple-300 transition-colors duration-300">
              Your Playlists
            </div>
            <div className="text-gray-300 text-sm mt-2">View and manage your playlists</div>
          </button>
          <button className="group p-6 rounded-2xl bg-black/15 backdrop-blur-md border border-white/10 hover:bg-black/25 hover:border-white/20 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            <div className="text-white font-semibold text-lg group-hover:text-purple-300 transition-colors duration-300">
              Recently Played
            </div>
            <div className="text-gray-300 text-sm mt-2">Jump back in</div>
          </button>
          <button className="group p-6 rounded-2xl bg-black/15 backdrop-blur-md border border-white/10 hover:bg-black/25 hover:border-white/20 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            <div className="text-white font-semibold text-lg group-hover:text-purple-300 transition-colors duration-300">
              Discover
            </div>
            <div className="text-gray-300 text-sm mt-2">New releases</div>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      setQuery("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a song or artist..."
          className="w-full p-5 pl-14 pr-16 rounded-2xl bg-black/20 backdrop-blur-md border border-white/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 hover:bg-black/25 focus:bg-black/30"
        />
        <div className="absolute left-5 top-1/2 -translate-y-1/2">
          <svg
            className="w-6 h-6 text-gray-400 group-focus-within:text-purple-400 transition-colors duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/40"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </form>
  )
}

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
        if (value && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
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

interface PlaylistsUIProps {
  playlists: Record<string, Track[]>;
  currentTrack: Track | null;
  sendMessage: (payload: string) => void;
  onBack: () => void;
  onGetPlaylistDetails: (playlistName: string) => void;
}

const PlaylistsUI = ({
  playlists = {},
  currentTrack = null,
  sendMessage,
  onBack,
  onGetPlaylistDetails,
}: PlaylistsUIProps) => {
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [showAddSong, setShowAddSong] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      sendMessage(`CreatePlaylist: ${newPlaylistName.trim()}`)
      setNewPlaylistName("")
    }
  }

  const handleAddTrackToPlaylist = (playlistName: string) => {
    if (currentTrack && typeof currentTrack.songId === "number") {
      sendMessage(`AddSongToPlaylist: ${playlistName}|${currentTrack.songId}`)
    } else {
      console.error("Cannot add to playlist: Invalid songId.", currentTrack)
    }
    setShowAddSong(false)
  }

  const handleRemoveTrack = (playlistName: string, songId: number) => {
    sendMessage(`RemoveSongFromPlaylist: ${playlistName}|${songId}`)
  }

  const handlePlayPlaylist = (name: string) => {
    sendMessage(`PlayPlaylist: ${name}`)
  }

  const handleDeletePlaylist = (name: string) => {
    if (window.confirm(`Are you sure you want to delete the playlist "${name}"?`)) {
      sendMessage(`DeletePlaylist: ${name}`)
    }
  }

  const handleSelectPlaylist = (name: string) => {
    if (selectedPlaylist === name) {
      setSelectedPlaylist(null)
      return
    }
    setSelectedPlaylist(name)
    const playlist = playlists[name]
    if (!playlist || !playlist.length) {
      onGetPlaylistDetails(name)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-6xl h-[34rem] bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl flex flex-col p-8 text-white"
    >
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-3 rounded-full hover:bg-white/10 transition-all duration-300 hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Your Playlists
        </h1>
        <div className="w-12"></div>
      </div>

      {currentTrack && (
        <div className="relative mb-6 text-left">
          <button
            onClick={() => setShowAddSong(!showAddSong)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all duration-300 group"
          >
            <div className="p-1 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors duration-300">
              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
              </svg>
            </div>
            <span className="font-medium">Add '{currentTrack.song_name}' to Playlist</span>
          </button>
          {showAddSong && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 w-64 rounded-2xl shadow-2xl bg-black/40 backdrop-blur-xl ring-1 ring-white/10 overflow-hidden z-10"
            >
              {Object.keys(playlists).map((name) => (
                <button
                  key={name}
                  onClick={() => handleAddTrackToPlaylist(name)}
                  className="block w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 transition-colors duration-200 first:rounded-t-2xl last:rounded-b-2xl"
                >
                  {name}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      )}

      <div className="flex-grow overflow-y-auto pr-2 scrollbar-custom space-y-6">
        {Object.keys(playlists).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="p-4 rounded-full bg-gray-500/10">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">You haven't created any playlists yet</p>
            <p className="text-gray-500 text-sm">Create your first playlist below</p>
          </div>
        ) : (
          Object.entries(playlists).map(([name, tracks]) => (
            <div key={name} className="bg-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">{name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayPlaylist(name)}
                    className="p-2.5 rounded-full hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 transition-all duration-300 hover:scale-110"
                    title="Play Playlist"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4.018 15.132A1 1 0 013 14.218V5.781a1 1 0 011.627-.781l8.438 4.219a1 1 0 010 1.562l-8.438 4.219z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeletePlaylist(name)}
                    className="p-2.5 rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-300 hover:scale-110"
                    title="Delete Playlist"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <ul className="space-y-2">
                {(tracks || []).map((track, index) => (
                  <li
                    key={`${track.songId}-${index}`}
                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <span className="text-white font-medium">{track.song_name}</span>
                        <span className="text-gray-400 ml-2">by {track.artist_name}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveTrack(name, track.songId)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all duration-300"
                      title="Remove song"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-white/10 flex-shrink-0">
        <div className="flex gap-3">
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="New playlist name..."
            className="flex-grow p-4 rounded-xl bg-black/20 border border-white/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
            onKeyPress={(e) => e.key === "Enter" && handleCreatePlaylist()}
          />
          <button
            onClick={handleCreatePlaylist}
            className="px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/40"
          >
            Create
          </button>
        </div>
      </div>
    </motion.div>
  )
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
    const [uiState, setUiState] = useState('auth'); 
    const ws = useRef<WebSocket | null>(null);
    const [lyrics, setLyrics] = useState([]);
    const [verifyError, setVerifyError] = useState("");
    const timerRef = useRef(null);
    const syncInfoRef = useRef({ serverStartTime: 0, startPosition: 0 });
    const [playlists, setPlaylists] = useState<Record<string, Track[]>>({});

    const handleGetPlaylistDetails = (playlistName: string) => {
    sendMessage(`GetPlaylistDetails: ${playlistName}`);
  };

  const handleShowPlaylists = () => {
        sendMessage("RequestPlaylistsUpdate");
        setUiState('playlists');
    };


async function waitForServiceReady(timeout = 60000, interval = 500) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const running = await (window as any).electronAPI.isTuneServiceRunning();
    if (running) {
      // try connecting to socket to confirm it's ready
      try {
        const socketTest = new WebSocket("ws://localhost:6767");
        await new Promise((res, rej) => {
          socketTest.onopen = () => { socketTest.close(); res(true); };
          socketTest.onerror = () => { socketTest.close(); rej(false); };
        });
        return true; // ready
      } catch { /* ignore, wait */ }
    }
    await new Promise(res => setTimeout(res, interval));
  }
  return false;
}
async function TryLaunchServer() {
    setStatusMessage('Finding application...');

    // 1. Get install path from registry via preload
    const pathResult = await (window as any).electronAPI.getTuneInstallPath();
    if (!pathResult.success || !pathResult.value) {
        setStatusMessage(`Error: Could not find application path. ${pathResult.error}`);
        return false;
    }

    const servicePath = `${pathResult.value}\\Tune_Service.exe`;
    setStatusMessage(`Found at ${servicePath}. Checking if service is already running...`);

    // 2. Launch service if not running
    let isRunning = await (window as any).electronAPI.isTuneServiceRunning();
    if (!isRunning) {
        setStatusMessage('Service not running. Launching...');
        const launchResult = await (window as any).electronAPI.launchAppDetached(servicePath);
        if (!launchResult.success) {
            setStatusMessage(`Error launching service: ${launchResult.error}`);
            return false;
        }
    }

    setStatusMessage('Waiting for service to accept connections...');

    // 3. Poll the WebSocket every 2 seconds until it connects
    const maxWaitTime = 120000; // 2 minutes max
    const intervalMs = 2000; // 2 seconds
    const startTime = Date.now();
    let connected = false;

    while (!connected && Date.now() - startTime < maxWaitTime) {
        try {
            await new Promise<void>((resolve, reject) => {
                const testSocket = new WebSocket('ws://localhost:6767');
                testSocket.onopen = () => {
                    testSocket.close();
                    resolve();
                };
                testSocket.onerror = () => {
                    testSocket.close();
                    reject();
                };
            });
            connected = true;
        } catch {
            setStatusMessage('Service not ready yet, retrying...');
            await new Promise(res => setTimeout(res, intervalMs));
        }
    }

    if (!connected) {
        setStatusMessage('Could not connect to the service in time.');
        return false;
    }

    setStatusMessage('Service is ready!');
    return true;
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
              if (data.type === "track_update") {
                  // [Debug Checkpoint]
                  console.log("[Debug] Received track_update data:", data);
                  setLyrics([]); // Clear previous lyrics
                  setTrackInfo(data);
                  syncInfoRef.current = {
                        serverStartTime: data.serverStartTime,
                        startPosition: data.startPosition || 0
                    };

                    const elapsed = (Date.now() - data.serverStartTime) / 1000;
                    setCurrentTime(data.startPosition + elapsed);
                    setIsPlaying(true); // Start the timer effect

                  try {
       // console.log("[Debug] Raw lyricsContent:", data.lyricsUrl);

        const parsedLyrics = parseSRT(data.lyricsUrl);
        if (parsedLyrics && parsedLyrics.length > 0) {
    setLyrics(parsedLyrics);
        }      
    } catch (e) {
        console.error("[Debug] Failed to parse lyricsContent:", e, data.lyricsUrl);
        setLyrics([]);
    }

                } else if (data.type === "playback_status") {
                    setIsPlaying(data.isPlaying); 
                    if (data.isPlaying) {
                        // Resuming playback, re-sync the timer
                        syncInfoRef.current = {
                            serverStartTime: data.serverStartTime,
                            startPosition: data.startPosition
                        };
                    } else {
                        // Paused, set the time to the exact final position
                        setCurrentTime(data.position);
                    }
                } else if (data.type === "playlists_update") {
                    setPlaylists(data.playlists || {});
                } else if (data.type === "songupdatefromwhentheuserclosedfrontendapp") {
                    // [Debug Checkpoint]
                    console.log("[Debug] Received songupdatefromwhentheuserclosedfrontendapp data:", data);
                    setLyrics([]); // Clear previous lyrics
                    setTrackInfo(data);
                    setCurrentTime(Number(data.current_position.position));
                    setIsPlaying(data.isPlaying); 
                    console.log("[Debug] Current position:", data.current_position.position);
}
            
            } catch (e) {
                if (event.data === "emailconfirmation") {
                    setUiState('verify'); 
                    setStatusMessage("");
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
      }

      initConnection();

        return () => {
        if (socket) socket.close();
    };
    }, []);

    const handleSearchSubmit = (query: string) => {
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
                    <AnimatePresence mode="wait">
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
                                onShowPlaylists={handleShowPlaylists}
                                lyrics={lyrics}
                                />
                                }
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}