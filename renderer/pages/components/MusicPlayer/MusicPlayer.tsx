import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import LyricsPlayer from "../LyricsPlayer/LyricsPlayer"
import { parseStrToLocale } from "../../utils/Utils" 
import ProfilePopup from "../ProfilePopup/ProfilePopup";
import { Track } from "../../utils/Utils";
import { send } from "process";

export default function MusicPlayerUI({
  trackInfo,
  onSearch,
  isPlaying,
  onTogglePlayPause,
  currentTime,
  onShowPlaylists,
  lyrics,
  onNextTrack,
  onPrevTrack,
  username,
  activeLineIndex,
  setActiveLineIndex,
  sendMessage,
  searchResults,
  onSongSelect,
  
}) {
  const [showLyrics, setShowLyrics] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  // --- Scrubbing & Optimistic State ---
  const [scrubTime, setScrubTime] = useState(null); 
  const [isScrubbing, setIsScrubbing] = useState(false);
  // Holds the sought time immediately after release to prevent visual snap-back
  const [optimisticSeek, setOptimisticSeek] = useState(null);
  
  const progressBarRef = useRef(null);
  const isScrubbingRef = useRef(false); 

  // --- Locale State ---
  const [localeAltCover, setLocaleAltCover] = useState("Loading...");
  const [localePlTitle, setLocalePlTitle] = useState("Loading...");
  const [localePlSubtitle, setLocalePlSubtitle] = useState("Loading...");
  const [localeRecentTitle, setLocaleRecentTitle] = useState("Loading...");
  const [localeRecentSubtitle, setLocaleRecentSubtitle] = useState("Loading...");
  const [localeDiscoverTitle, setLocaleDiscoverTitle] = useState("Loading...");
  const [localeDiscoverSubtitle, setLocaleDiscoverSubtitle] = useState("Loading...");

  useEffect(() => {
    (async () => {
      setLocaleAltCover(await parseStrToLocale("home_player.alt_cover"));
      setLocalePlTitle(await parseStrToLocale("home_player.pl_title"));
      setLocalePlSubtitle(await parseStrToLocale("home_player.pl_subtitle"));
      setLocaleRecentTitle(await parseStrToLocale("home_player.recent_title"));
      setLocaleRecentSubtitle(await parseStrToLocale("home_player.recent_subtitle"));
      setLocaleDiscoverTitle(await parseStrToLocale("home_player.discover_title"));
      setLocaleDiscoverSubtitle(await parseStrToLocale("home_player.discover_subtitle"));
    })();
  }, []);

  const {
    song_name = "...",
    artist_name = "...",
    album = "...",
    coverArtUrl = "",
    song_length_sec = 0,
    song_id = 0,
    lyrics: lyricsUrl = "",
  } = trackInfo || {}

  const formatTime = (seconds) => {
    const totalSeconds = Math.floor(seconds)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // --- Sync Optimistic State with Real Time ---
  // If the real currentTime gets close to our optimistic seek, or if 2 seconds pass, clear the optimistic state.
  useEffect(() => {
    if (optimisticSeek !== null) {
        const timeDiff = Math.abs(currentTime - optimisticSeek);
        // If audio catches up (within 1.5s window), sync back to real time
        if (timeDiff < 1.5) {
            setOptimisticSeek(null);
        }
    }
  }, [currentTime, optimisticSeek]);

  // Failsafe: Clear optimistic seek after 2 seconds if audio never catches up
  useEffect(() => {
    if (optimisticSeek !== null) {
        const timer = setTimeout(() => setOptimisticSeek(null), 2000);
        return () => clearTimeout(timer);
    }
  }, [optimisticSeek]);


  // **Determine Display Time**: 
  // 1. Dragging? Show drag position.
  // 2. Just dropped (optimistic)? Show drop position.
  // 3. Normal? Show actual player time.
  let displayTime = currentTime;
  if (isScrubbing && scrubTime !== null) {
      displayTime = scrubTime;
  } else if (optimisticSeek !== null) {
      displayTime = optimisticSeek;
  }

  const progressPercent = song_length_sec > 0 ? (displayTime / song_length_sec) * 100 : 0;


  // --- Seek Logic ---
  const calculateSeekTime = useCallback((clientX) => {
    if (!progressBarRef.current) return 0;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    return percentage * song_length_sec;
  }, [song_length_sec]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    if (song_length_sec === 0) return;

    // Start scrubbing
    isScrubbingRef.current = true;
    setIsScrubbing(true);
    setOptimisticSeek(null); // Clear any previous optimistic state

    // Set initial position immediately
    const startScrubTime = calculateSeekTime(e.clientX);
    setScrubTime(startScrubTime);

    const handleMouseMove = (moveEvent) => {
      if (!isScrubbingRef.current) return;
      const newTime = calculateSeekTime(moveEvent.clientX);
      setScrubTime(newTime);
    };

    const handleMouseUp = (upEvent) => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      if (!isScrubbingRef.current) return;

      const finalSeekTime = calculateSeekTime(upEvent.clientX);
      
      // 1. Update visual state
      setIsScrubbing(false);
      isScrubbingRef.current = false;
      setScrubTime(null);
      
      // 2. Set Optimistic "Hold" Time (keeps the bar at the target while audio loads)
      setOptimisticSeek(finalSeekTime);

      // 3. Send Message
      if (sendMessage) {
        sendMessage("seek: " + finalSeekTime);
      }

      const timer = setTimeout(() => {onTogglePlayPause(); onTogglePlayPause();}, 500);
      return () => clearTimeout(timer);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full flex flex-col items-center select-none"
    >
      <div className="w-full max-w-7xl flex items-center justify-center gap-8 relative h-[26rem]">
        <div
          className={`transition-all duration-700 ease-out ${showLyrics ? "md:-translate-x-1/2" : "md:translate-x-0"}`}
        >
          <div className="w-full max-w-2xl bg-black/20 backdrop-blur-xl rounded-3xl border-white/10 shadow-2xl flex flex-col md:flex-row p-8 gap-6 items-center hover:bg-black/25 transition-all duration-500">
            <div className="relative group">
              <img
                src={coverArtUrl || ""}
                alt={localeAltCover}
                className="w-52 h-52 md:w-60 md:h-60 object-cover rounded-3xl shadow-2xl flex-shrink-0 transition-all duration-700 group-hover:scale-[1.08] group-hover:shadow-white-500/20"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="flex flex-col flex-1 justify-center w-full h-full space-y-6">
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg leading-tight">{song_name}</h2>
                <p className="text-lg md:text-xl text-gray-200 drop-shadow-md font-medium">{artist_name}</p>
                <p className="text-base text-gray-300 drop-shadow-md">{album}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-white/80 w-12 text-center font-mono">{formatTime(displayTime)}</span>
                  
                  {/* --- Progress Bar --- */}
                  <div 
                    ref={progressBarRef}
                    onMouseDown={handleMouseDown}
                    className="flex-1 bg-white/10 rounded-full h-2 group cursor-pointer hover:h-2.5 transition-all duration-200 relative py-2 -my-2 bg-clip-content"
                  >
                     <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center">
                       <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                            className="bg-gradient-to-r text-gray-500 h-full rounded-full transition-all duration-100 shadow-lg shadow-white-500/30"
                            style={{ width: `${progressPercent}%`, backgroundColor: "white", maxWidth: "100%" }}
                            />
                       </div>
                       {/* Handle is separated to avoid being clipped by overflow-hidden */}
                       <div className={`absolute h-4 w-4 rounded-full bg-white transition-opacity duration-100 shadow-md ${isScrubbing || optimisticSeek ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            style={{ left: `${progressPercent}%`, transform: 'translate(-50%, 0)' }}
                       />
                    </div>
                  </div>
                  {/* --- End Progress Bar --- */}
                  
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
                      className={`w-6 h-6 transition-colors duration-300 ${isLiked ? "text-white-400 fill-current" : ""}`}
                      fill={isLiked ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                    </svg>
                  </button>

                  <div className="flex items-center gap-6">
                    <button onClick={onPrevTrack} className="p-3 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                    </button>

                    <button
                      onClick={onTogglePlayPause}
                      className="p-6 rounded-full bg-gradient-to-r from-white-500 to-white-600 text-white hover:from-white-600 hover:to-white-700 hover:scale-105 shadow-xl hover:shadow-white-500/50 transition-all duration-300"
                    >
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d={isPlaying ? "M6 19h4V5H6v14zm8-14v14h4V5h-4z" : "M8 5v14l11-7z"} />
                      </svg>
                    </button>

                    <button onClick={onNextTrack} className="p-3 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowLyrics(!showLyrics)}
                    className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${showLyrics ? "text-white-400 bg-white-400/10" : "text-gray-400 hover:text-white hover:bg-white/10"}`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed top-10 right-12 z-50">
          <ProfilePopup name={username} sendMessage={sendMessage}/>
        </div>

        <div
          className={`absolute right-0 transition-all duration-700 ease-out w-full md:w-1/2 flex-shrink-0 ${showLyrics ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 -z-10"}`}
        >
          <div className="h-[24rem] overflow-hidden">
            <LyricsPlayer lyrics={lyrics} currentTime={currentTime} activeLineIndex={activeLineIndex} setActiveLineIndex={setActiveLineIndex}  />
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl space-y-6">
        <SearchBar sendMessage={sendMessage} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button onClick={onShowPlaylists} className="group p-6 rounded-2xl bg-black/15 backdrop-blur-md border border-white/10 hover:bg-black/25 hover:border-white/20 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            <div className="text-white font-semibold text-lg group-hover:text-white-300 transition-colors duration-300">{localePlTitle}</div>
            <div className="text-gray-300 text-sm mt-2">{localePlSubtitle}</div>
          </button>
          <button className="group p-6 rounded-2xl bg-black/15 backdrop-blur-md border border-white/10 hover:bg-black/25 hover:border-white/20 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            <div className="text-white font-semibold text-lg group-hover:text-white-300 transition-colors duration-300">{localeRecentTitle}</div>
            <div className="text-gray-300 text-sm mt-2">{localeRecentSubtitle}</div>
          </button>
          <button className="group p-6 rounded-2xl bg-black/15 backdrop-blur-md border border-white/10 hover:bg-black/25 hover:border-white/20 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            <div className="text-white font-semibold text-lg group-hover:text-white-300 transition-colors duration-300">{localeDiscoverTitle}</div>
            <div className="text-gray-300 text-sm mt-2">{localeDiscoverSubtitle}</div>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

interface SearchBarProps {
  sendMessage: (payload: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ sendMessage }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localeSearch, setLocaleSearch] = useState("Loading...");
  
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      // @ts-ignore
      if (typeof parseStrToLocale === 'function') {
         // @ts-ignore
        setLocaleSearch(await parseStrToLocale("home_player.search_placeholder"));
      } else {
        setLocaleSearch("Search for a song...");
      }
    })();
    
    // Optional: Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults([]); 

    try {
      const url = `https://tune-mu.com/api/search?query=${encodeURIComponent(query.trim())}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid response");
      }
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTrack = (track: Track) => {
    sendMessage(`Search: ~#!: ${track.song_name} - ${track.artist_name}`);
    setResults([]);
    setQuery("");
  };

  return (
    <div className="relative mt-6 w-full z-50" ref={searchRef}>
      {/* --- SEARCH INPUT --- */}
      <form onSubmit={handleSearch}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={localeSearch}
            className="w-full p-4 pl-12 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white-500 transition-all duration-300"
          />
          
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-900 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* --- RESULTS DROPDOWN --- */}
      {(results.length > 0 || error) && (
        <div className="absolute top-full mt-2 left-0 w-full bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {error && <div className="p-4 text-center text-red-400">{error}</div>}

          {results.length > 0 && (
            <div className="divide-y divide-white/5">
              {results.map((track) => (
                <button
                  key={track.song_id}
                  onClick={() => handleSelectTrack(track)}
                  className="w-full flex items-center gap-4 p-3 hover:bg-white/10 transition-colors group text-left"
                >
                  {/* --- COVER ART --- */}
                  <div className="relative flex-shrink-0 w-12 h-12 bg-neutral-800 rounded-md overflow-hidden border border-white/10">
                    {"https://tune-mu.com/music/" + track.artist_name + "/" + track.coverArtUrl ? (
                      <img 
                        src={"https://tune-mu.com/music/" + track.artist_name + "/" + track.coverArtUrl} 
                        alt={track.album}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    
                    {/* Fallback Icon (Note Icon) - Shown if no URL or if Load Fails */}
                    <div className={`absolute inset-0 flex items-center justify-center bg-neutral-800 ${("https://tune-mu.com/music/" + track.artist_name + "/" + track.coverArtUrl) ? 'hidden' : ''}`}>
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                  </div>

                  {/* --- TEXT INFO --- */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-white font-medium truncate group-hover:text-blue-400 transition-colors">
                      {track.song_name}
                    </span>
                    <span className="text-gray-400 text-sm truncate">
                      {track.artist_name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};