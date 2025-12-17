import { Track, parseStrToLocale } from "../../utils/Utils";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface PlaylistsUIProps {
  playlists: Record<string, Track[]>;
  currentTrack: Track | null;
  sendMessage: (payload: string) => void;
  onBack: () => void;
  onGetPlaylistDetails: (playlistName: string) => void;
}

export default function PlaylistsUi({
  playlists = {},
  currentTrack = null,
  sendMessage,
  onBack,
  onGetPlaylistDetails,
}: PlaylistsUIProps) {

  const SearchOverlay = ({ onClose, playlistName, onTrackSelectAndAdd, sendMessage }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setResults([]);
        
        sendMessage(`Search: ${query}`);
        
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-900 w-full max-w-lg max-h-[80vh] rounded-xl shadow-2xl p-6 border border-white/10 flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Search for a Song to Add to "{playlistName}"
                </h3>
                
                {/* Search Form */}
                <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Song or Artist name..."
                        className="flex-grow p-3 rounded-lg bg-neutral-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                    <button type="submit" disabled={isLoading} className="p-3 bg-white/20 hover:bg-white/30 rounded-lg text-white disabled:opacity-50 transition-colors">
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {/* Search Results Display */}
                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                    {results.map(track => (
                        <button
                            key={track.song_id}
                            onClick={() => onTrackSelectAndAdd(track)}
                            className="w-full text-left p-3 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <p className="text-white font-medium">{track.song_name}</p>
                            <p className="text-gray-400 text-sm">{track.artist_name} - {track.album}</p>
                        </button>
                    ))}
                    {!isLoading && results.length === 0 && query.trim() && (
                        <p className="text-gray-500 text-center py-4">No results found.</p>
                    )}
                </div>

                {/* Close Button */}
                <button onClick={onClose} className="mt-4 py-3 rounded-lg bg-gray-600/50 text-white hover:bg-gray-600 transition-colors">
                    Close
                </button>
            </div>
        </div>
    );
};


  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showAddSong, setShowAddSong] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);

  // --- Locale State ---
  const [localeTitle, setLocaleTitle] = useState("Loading...");
  const [localeAddSong, setLocaleAddSong] = useState("Add to Playlist");
  const [localeNoPlTitle, setLocaleNoPlTitle] = useState("Loading...");
  const [localeNoPlSubtitle, setLocaleNoPlSubtitle] = useState("Loading...");
  const [localeAddCurrentSong, setLocaleAddCurrentSong] = useState("Loading...");
  const [localeSearchForSong, setLocaleSearchForSong] = useState("Loading...");
  const [localePlay, setLocalePlay] = useState("Play");
  const [localeDelete, setLocaleDelete] = useState("Delete");
  const [localeRemove, setLocaleRemove] = useState("Remove");

  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  const [localeNewPlaceholder, setLocaleNewPlaceholder] = useState("Loading...");
  const [localeCreate, setLocaleCreate] = useState("Loading...");

  const handleCloseSearch = () => {
      setShowSearchOverlay(false);
  };

  useEffect(() => {
    (async () => {
      setLocaleTitle(await parseStrToLocale("playlists.title"));
      setLocaleAddSong(await parseStrToLocale("playlists.addsong"));
      setLocaleNoPlTitle(await parseStrToLocale("playlists.nopl_title"));
      setLocaleNoPlSubtitle(await parseStrToLocale("playlists.nopl_subtitle"));
      setLocalePlay(await parseStrToLocale("playlists.play"));
      setLocaleDelete(await parseStrToLocale("playlists.delete"));
      setLocaleRemove(await parseStrToLocale("playlists.remove"));
      setLocaleNewPlaceholder(await parseStrToLocale("playlists.new_placeholder"));
      setLocaleCreate(await parseStrToLocale("playlists.create"));
      setLocaleAddCurrentSong(await parseStrToLocale("playlists.add_current_song"));
      setLocaleSearchForSong(await parseStrToLocale("playlists.search_for_song"));
    })();
  }, []);

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      sendMessage(`CreatePlaylist: ${newPlaylistName.trim()}`);
      setNewPlaylistName("");
    }
  };

  const handleAddTrackToPlaylist = (playlistName: string) => {
    if (currentTrack && typeof currentTrack.song_id === "number") {
      sendMessage(`AddSongToPlaylist: ${playlistName}|${currentTrack.song_id}`);
    } else {
      console.error("Cannot add to playlist: Invalid songId.", currentTrack);
    }

    setShowAddSong(false);
  };

  const handleRemoveTrack = (
    playlistName: string,
    song_idToRemove: number
  ) => {
    console.log(`RemoveSongFromPlaylist: ${playlistName}|${song_idToRemove}`);
    if (typeof song_idToRemove === "number") {
      sendMessage(`RemoveSongFromPlaylist: ${playlistName}|${song_idToRemove}`);
    }
  };

  const handlePlayPlaylist = (name: string) => {
    sendMessage(`PlayPlaylist: ${name}`);
  };

  const handleDeletePlaylist = (name: string) => {
    sendMessage(`DeletePlaylist: ${name}`);
  };

  const handleSelectPlaylist = (name: string) => {
    if (selectedPlaylist === name) {
      setSelectedPlaylist(null);
      return;
    }
    setSelectedPlaylist(name);
    const playlist = playlists[name];
    if (!playlist || !playlist.length) {
      onGetPlaylistDetails(name);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-6xl h-[58rem] bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl flex flex-col p-8 text-white no-scrollbar"
    >
      <div className="flex items-center justify-between mb-6 flex-shrink-0 no-scrollbar">
        <button
          onClick={onBack}
          className="p-3 rounded-full hover:bg-white/10 transition-all duration-300 hover:scale-110"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          {localeTitle}
        </h1>
        <div className="w-12"></div>
      </div>

      {currentTrack && (
        <div className="relative mb-6 text-left">
          {/* <button
            onClick={() => setShowAddSong(!showAddSong)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all duration-300 group"
          >
            <div className="p-1 rounded-lg bg-white-500/20 group-hover:bg-white-500/30 transition-colors duration-300">
              <svg
                className="w-4 h-4 text-white-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
              </svg>
            </div>
            <span className="font-medium">
              {localeAddSong.replace("{song_name}", currentTrack.song_name)}
            </span>
          </button> */}
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

      <div className="flex-grow overflow-y-auto pr-2 scrollbar-custom space-y-6 no-scrollbar">
        {Object.keys(playlists).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="p-4 rounded-full bg-gray-500/10">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">{localeNoPlTitle}</p>
            <p className="text-gray-500 text-sm">{localeNoPlSubtitle}</p>
          </div>
        ) : (
          Object.entries(playlists).map(([name, tracks]) => (
            <div
              key={name}
              className="bg-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">{name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayPlaylist(name)}
                    className="p-2.5 rounded-full hover:bg-white-500/20 text-white-400 hover:text-white-300 transition-all duration-300 hover:scale-110"
                    title={localePlay}
                  >
                    <svg
                      className="w-7 h-7 opacity-50 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4.018 15.132A1 1 0 013 14.218V5.781a1 1 0 011.627-.781l8.438 4.219a1 1 0 010 1.562l-8.438 4.219z" />
                    </svg>
                  </button>
                  { /* hamburger menu or some shit */ 
                  /* original code
                  
                  <button
                    onClick={() => handleDeletePlaylist(name)}
                    className="p-2.5 rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-300 hover:scale-110"
                    title={localeDelete}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  */
                  }

                  <div
  tabIndex={0}
  onFocus={() => setPlaylistOpen(true)}
  onBlur={() => setPlaylistOpen(false)}
  className="relative outline-none"
>
  {/* Hamburger Icon */}
  <svg
    viewBox="0,0 50,100"
    height="24"
    width="24"
    role="img"
    className="opacity-50 hover:opacity-100 transition-opacity duration-300 cursor-pointer fill-[#ccc]"
  >
    <circle cx="50" cy="51" r="10" />
    <circle cx="25" cy="51" r="10" />
    <circle cx="0" cy="51" r="10" />
  </svg>

  {/* Playlist Popup */}
  <div
    className={`absolute right-0 mt-2 w-60 rounded-md bg-neutral-900
      shadow-[0_0_0_1px_hsl(0,0%,12%)] p-2 transition-all duration-300
      ${playlistOpen ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-1"}
    `}
  >
    <ul className="flex flex-col gap-1 text-sm text-[#ccc]">
      <li className="px-4 py-2 rounded-md hover:bg-neutral-700/20 cursor-pointer" onClick={() => handleAddTrackToPlaylist(name)}>
        {localeAddCurrentSong.replace("{currentTrack.song_name}", currentTrack ? currentTrack.song_name : "").replace("{name}", name)}
      </li>

      <li 
        className="px-4 py-2 rounded-md hover:bg-neutral-700/20 cursor-pointer" 
        onClick={() => setShowSearchOverlay(true)}
        >
              {localeSearchForSong}
            </li>

      <hr className="my-2 border-dashed border-neutral-700" />

      <li className="px-4 py-2 rounded-md hover:bg-[#962434] cursor-pointer" onClick={() => handleDeletePlaylist(name)}>
        {localeDelete}
      </li>
    </ul>
  </div>
</div>
{showSearchOverlay && (
        <SearchOverlay 
          onClose={handleCloseSearch} 
          playlistName={name}
          sendMessage={sendMessage}
          onTrackSelectAndAdd={(track) => {
            console.log(`Adding ${track.song_name} to playlist ${name}`);
            handleCloseSearch(); // Close the overlay after selection
          }}
        />
      )}


                </div>
              </div>

<ul className="space-y-2">
{(tracks || []).map((track, index) => {
// FIX: Define isPlaying here, accessible to the JSX below
const isPlaying = currentTrack?.song_id === track.song_id;

return (
<li
key={`${track.song_id}-${index}`}
// Apply subtle background change for playing track
className={`group flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
isPlaying ? "bg-blue-900/40" : "hover:bg-white/10"
}`}
>
<div className="flex items-center gap-3">
{/* Enhanced Track Number & Playing Indicator */}
<div
className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors duration-300 ${
isPlaying
? "bg-blue-500/80 text-white" // Accent color for active song
: "bg-white/10 text-gray-400 group-hover:bg-white/20"
}`}
>
{isPlaying ? (
<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
</svg> // Pause icon
) : (
index + 1
)}
</div>
<div>
{/* Enhanced Song Name */}
<span
className={`${
isPlaying
? "text-blue-400 font-extrabold" // Accent color for active song
: "text-white font-bold"
}`}
>
{track.song_name}
</span>
{/* Enhanced Artist Name */}
<span className="text-gray-500 ml-2">
{track.artist_name}
</span>
</div>
</div>
<button
onClick={() => handleRemoveTrack(name, track.song_id)}
className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all duration-300"
title={localeRemove}
>
<svg
className="w-4 h-4"
fill="currentColor"
viewBox="0 0 20 20"
>
<path
fillRule="evenodd"
d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
clipRule="evenodd"
/>
</svg>
</button>
</li>
);
})}
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
            placeholder={localeNewPlaceholder}
            className="flex-grow p-4 rounded-xl bg-black/20 border border-white/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white-500/50 focus:border-white-500/50 transition-all duration-300"
            onKeyPress={(e) => e.key === "Enter" && handleCreatePlaylist()}
          />
          <button
            onClick={handleCreatePlaylist}
            className="px-6 py-4 rounded-xl bg-gradient-to-r from-white-500 to-white-600 hover:from-white-600 hover:to-white-700 text-white font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-white-500/40"
          >
            {localeCreate}
          </button>
        </div>
      </div>
    </motion.div>
  );
};