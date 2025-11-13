import React, { useEffect, useRef, useState, useMemo } from "react";

export interface WordTiming {
  text: string;
  start: number;
  end: number;
}

interface LyricLine {
  time: number;
  text: string;
  words?: WordTiming[];
}

interface LyricsPlayerProps {
  lyrics: LyricLine[];
  currentTime: number;
  activeLineIndex?: number;
  setActiveLineIndex?: (index: number) => void;
  isPlaying?: boolean;
  song_id?: string | number;
}

export default function LyricsPlayer({
  lyrics = [],
  currentTime,
  activeLineIndex,
  setActiveLineIndex = () => {},
  isPlaying = true,
  song_id,
}: LyricsPlayerProps) {
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayLyrics, setDisplayLyrics] = useState(lyrics);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevsong_idRef = useRef(song_id);
  const rafRef = useRef<number>();

  /** --- Performance: Memoize lines --- */
  const memoizedLyrics = useMemo(() => displayLyrics, [displayLyrics]);

  /** --- Handle song transition --- */
  useEffect(() => {
    if (prevsong_idRef.current !== song_id && prevsong_idRef.current !== undefined) {
      setIsTransitioning(true);
      setTimeout(() => {
        setDisplayLyrics(lyrics);
        setActiveLineIndex(-1);
        setTimeout(() => setIsTransitioning(false), 250);
      }, 300);
    } else {
      setDisplayLyrics(lyrics);
    }
    prevsong_idRef.current = song_id;
  }, [lyrics, song_id]);

  useEffect(() => {
    if (!memoizedLyrics.length || isTransitioning) return;
    cancelAnimationFrame(rafRef.current!);
    const update = () => {
      let newIndex = -1;
      for (let i = 0; i < memoizedLyrics.length; i++) {
        const start = memoizedLyrics[i].time;
        const next = memoizedLyrics[i + 1]?.time ?? Infinity;
        if (currentTime >= start && currentTime < next) {
          newIndex = i;
          break;
        }
      }
      if (newIndex !== activeLineIndex) {
        // 🔸 Reset word highlight immediately when the line changes
        setActiveWordIndex(-1);
        setActiveLineIndex(newIndex);
      }
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current!);
  }, [currentTime, memoizedLyrics, isTransitioning]);

  /** --- Efficient active line tracking --- */
  useEffect(() => {
    if (!memoizedLyrics.length || isTransitioning) return;
    cancelAnimationFrame(rafRef.current!);
    const update = () => {
      let newIndex = -1;
      for (let i = 0; i < memoizedLyrics.length; i++) {
        const start = memoizedLyrics[i].time;
        const next = memoizedLyrics[i + 1]?.time ?? Infinity;
        if (currentTime >= start && currentTime < next) {
          newIndex = i;
          break;
        }
      }
      if (newIndex !== activeLineIndex) setActiveLineIndex(newIndex);
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current!);
  }, [currentTime, memoizedLyrics, isTransitioning]);

  useEffect(() => {
    if (activeLineIndex === -1 || isTransitioning) return;
    const currentLine = memoizedLyrics[activeLineIndex];
    if (!currentLine?.words) {
      setActiveWordIndex(-1);
      return;
    }
    let newWord = -1;
    for (let i = currentLine.words.length - 1; i >= 0; i--) {
      const w = currentLine.words[i];
      if (currentTime >= w.start) {
        newWord = i;
        break;
      }
    }
    if (newWord !== activeWordIndex) setActiveWordIndex(newWord);
  }, [currentTime, memoizedLyrics, activeLineIndex, isTransitioning]);

  /** --- Auto-scroll active line into view --- */
  useEffect(() => {
    if (activeLineIndex === -1 || !scrollContainerRef.current) return;
    const activeLine = scrollContainerRef.current.children[activeLineIndex] as HTMLElement;
    if (!activeLine) return;
    scrollContainerRef.current.scrollTo({
      top: activeLine.offsetTop - scrollContainerRef.current.offsetHeight / 2 + activeLine.offsetHeight / 2,
      behavior: "smooth",
    });
  }, [activeLineIndex]);

  /** --- Styles --- */
  const baseContainer =
    "h-full no-scrollbar overflow-y-auto scrollbar-none px-8 py-8 transition-all duration-500 ease-out text-center select-none";
  const fadeStyle = isTransitioning
    ? "opacity-0 scale-95"
    : "opacity-100 scale-100";
  const inactiveOpacity = isPlaying ? "opacity-100" : "opacity-60";
  if (!memoizedLyrics.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>No lyrics available</p>
      </div>
    );
  }
  return (
    <div
      ref={scrollContainerRef}
      className={`${baseContainer} ${fadeStyle} ${inactiveOpacity}`}
    >
      {memoizedLyrics.map((line, i) => {
        const isActive = i === activeLineIndex;
        const isPast = i < activeLineIndex;
        const isUpcoming = i > activeLineIndex;
        const lineClass = `
          transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
          text-[1.6rem] md:text-[2.0rem] font-semibold leading-relaxed
          ${isActive ? "text-white scale-100" : "text-gray-400 scale-100"}
          ${isPast ? "opacity-50" : isUpcoming ? "opacity-60" : ""}
          ${isActive ? "drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]" : ""}
        `;
        // Parallax-style blur/fade
        const lineStyle = {
          transform: `translateY(${isActive ? "0px" : isPast ? "-10px" : "10px"})`,
          filter: isActive ? "blur(0px)" : "blur(1.2px)",
          transition: "all 0.6s ease-out",
        };
        if (line.words && line.words.length > 0) {
          const showAsActive = i === activeLineIndex;

          return (
            <p
              key={`${song_id}-${i}`}
              className={lineClass}
              style={{
                ...lineStyle,
                overflow: "hidden",
                wordWrap: "normal", // Keep this for legacy support
                wordBreak: "normal", // 👈 ADD THIS to handle long words
                whiteSpace: "normal",
                lineHeight: "1.3",
                textAlign: "left", // 👈 CHANGE to left-align the content
                display: "block",
              }}
            >
              {showAsActive
                ? // 🔸 Only the active line gets word-level glide animation
                  line.words.map((word, wi) => {
                    const isPassed = wi < activeWordIndex;
                    const isCurrent = wi === activeWordIndex;
                    const isFuture = wi > activeWordIndex;
                    const isLastWord = wi === line.words!.length - 1;
                    if (isPassed) {
                      return (
                        <React.Fragment key={`${song_id}-${i}-${wi}`}>
                          <span className="text-white">{word.text}</span>
                          {!isLastWord && " "}
                        </React.Fragment>
                      );
                    } else if (isFuture) {
                      return (
                        <React.Fragment key={`${song_id}-${i}-${wi}`}>
                          <span className="text-gray-500/70">{word.text}</span>
                          {!isLastWord && " "}
                        </React.Fragment>
                      );
                    } else {
                      // Current word with glide (wipe) animation
                      const duration = word.end - word.start;
                      const progress = duration > 0
                        ? Math.max(0, Math.min(100, ((currentTime - word.start) / duration) * 100))
                        : 0;
                      return (
                        <React.Fragment key={`${song_id}-${i}-${wi}`}>
                          <span
                            style={{
                              position: "relative",
                              display: "inline-block",
                              whiteSpace: "normal",
                              wordWrap: "normal",
                              wordBreak: "normal",
                            }}
                          >
                            <span className="text-gray-500/70">{word.text}</span>
                            <span
                              style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: `${progress}%`,
                                overflow: "hidden",
                                transition: "width 0.1s linear",
                              }}
                              className="text-white"
                            >
                              {word.text}
                            </span>
                          </span>
                          {!isLastWord && " "}
                        </React.Fragment>
                      );
                    }
                  })
                : // 🔸 All other lines show static text (no per-word animation)
                  line.text}
            </p>
          );
        }
        // Verse-synced fallback
        return (
          <p
            key={`${song_id}-${i}`}
            className={lineClass}
            style={{
              ...lineStyle,
              overflow: "hidden",
              wordWrap: "normal", // Keep this
              wordBreak: "normal", // 👈 ADD THIS
              whiteSpace: "normal",
              maxWidth: "90%",
              margin: "0 auto",
              letterSpacing: "0.25px",
              lineHeight: "1.3",
              textAlign: "left", // 👈 CHANGE to left-align the content
              display: "block",
            }}
          >
            {line.text}
          </p>
        );
      })}
      <div className="h-32" />
    </div>
  );
} // TODO: dont make the animations TOO choppy