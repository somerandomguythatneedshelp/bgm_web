import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import LyricsPlayer from "../LyricsPlayer/LyricsPlayer"
import { parseStrToLocale } from "../../utils/Utils" 
import ProfilePopup from "../ProfilePopup/ProfilePopup";

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
  sendMessage
}) {
  const [showLyrics, setShowLyrics] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

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
  // --- End Locale ---

  const {
    song_name = "...",
    artist_name = "...",
    album = "...",
    coverArtUrl = "",
    song_length_sec = 0,
    song_id = 0, // Added song_id to match JSON
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
                  <span className="text-sm text-white/80 w-12 text-center font-mono">{formatTime(currentTime)}</span>
                  <div className="flex-1 bg-white/10 rounded-full h-2 group cursor-pointer hover:h-2.5 transition-all duration-200">
                    <div
                      className="bg-gradient-to-r text-gray-500 h-full rounded-full transition-all duration-300 shadow-lg shadow-white-500/30"
                      style={{ width: `${(currentTime / song_length_sec) * 100}%`, backgroundColor: "white", maxWidth: "100%" }}
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
                      className={`w-6 h-6 transition-colors duration-300 ${isLiked ? "text-white-400 fill-current" : ""}`}
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
                    <button 
                    onClick={onPrevTrack}
                    className="p-3 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                      </svg>
                    </button>

                    <button
                      onClick={onTogglePlayPause}
                      className="p-6 rounded-full bg-gradient-to-r from-white-500 to-white-600 text-white hover:from-white-600 hover:to-white-700 hover:scale-105 shadow-xl hover:shadow-white-500/50 transition-all duration-300"
                    >
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d={isPlaying ? "M6 19h4V5H6v14zm8-14v14h4V5h-4z" : "M8 5v14l11-7z"} />
                      </svg>
                    </button>

                    <button 
                    onClick={onNextTrack}
                    className="p-3 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                      </svg>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowLyrics(!showLyrics)}
                    className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${showLyrics ? "text-white-400 bg-white-400/10" : "text-gray-400 hover:text-white hover:bg-white/10"}`}
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

      <div className="fixed top-10 right-12 z-50">
  <ProfilePopup name={username}
   sendMessage={sendMessage}/>
</div>


        <div
          className={`absolute right-0 transition-all duration-700 ease-out w-full md:w-1/2 flex-shrink-0 ${showLyrics ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 -z-10"}`}
        >
          <div className="h-[24rem] overflow-hidden">
            <LyricsPlayer 
            lyrics={lyrics}
            currentTime={currentTime}
            activeLineIndex={activeLineIndex}
            setActiveLineIndex={setActiveLineIndex}  />
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
            <div className="text-white font-semibold text-lg group-hover:text-white-300 transition-colors duration-300">
              {localePlTitle}
            </div>
            <div className="text-gray-300 text-sm mt-2">{localePlSubtitle}</div>
          </button>
          <button className="group p-6 rounded-2xl bg-black/15 backdrop-blur-md border border-white/10 hover:bg-black/25 hover:border-white/20 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            <div className="text-white font-semibold text-lg group-hover:text-white-300 transition-colors duration-300">
              {localeRecentTitle}
            </div>
            <div className="text-gray-300 text-sm mt-2">{localeRecentSubtitle}</div>
          </button>
          <button className="group p-6 rounded-2xl bg-black/15 backdrop-blur-md border border-white/10 hover:bg-black/25 hover:border-white/20 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            <div className="text-white font-semibold text-lg group-hover:text-white-300 transition-colors duration-300">
              {localeDiscoverTitle}
            </div>
            <div className="text-gray-300 text-sm mt-2">{localeDiscoverSubtitle}</div>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

const SearchBar = ({ onSearch }) => {
    const [query, setQuery] = useState("");
    // --- Locale State ---
    const [localeSearch, setLocaleSearch] = useState("Loading...");

    useEffect(() => {
      (async () => {
        setLocaleSearch(await parseStrToLocale("home_player.search_placeholder"));
      })();
    }, []);
    // --- End Locale ---

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
            setQuery("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6">
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
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-900 rounded-lg bg-white-600 hover:bg-white-700 transition-colors">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </div>
        </form>
    );
  }