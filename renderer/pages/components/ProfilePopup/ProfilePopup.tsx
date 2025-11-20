"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"

export interface WordTiming {
  text: string
  start: number
  end: number
}

export interface LyricLine {
  time: number
  text: string
  words?: WordTiming[]
}

interface LyricsPlayerProps {
  lyrics: LyricLine[]
  currentTime: number
  activeLineIndex?: number
  setActiveLineIndex?: (index: number) => void
  isPlaying?: boolean
  song_id?: string | number
  slideDuration?: number // New prop for controlling smoothness
}

const Word = React.memo(
  ({
    word,
    currentTime,
    isLineActive,
    slideDuration = 100,
  }: {
    word: WordTiming
    currentTime: number
    isLineActive: boolean
    slideDuration?: number
  }) => {
    // Calculate state based on time
    const isPassed = currentTime > word.end
    const isFuture = currentTime < word.start
    const isCurrent = !isPassed && !isFuture

    // If the line isn't active, we can simplify the logic to just "passed" or "future"
    // based on the line's general state, but for accuracy we keep the time check
    // or we rely on the parent to pass 0 if inactive (which we do).

    if (!isLineActive) {
      // If line is not active, words are either all future or all past depending on line index.
      // But since we pass 0 or Infinity for inactive lines, we need to handle that.
      // Actually, the parent Line component handles the "past/future" styling for the whole line
      // if it's not active. But if we want per-word precision even when line isn't active
      // (e.g. just finished), we might need it.
      // However, for optimization, we assume inactive lines don't need per-word updates.
      return <span className="text-gray-500/70">{word.text}</span>
    }

    if (isPassed) {
      return <span className="text-white">{word.text}</span>
    }

    if (isFuture) {
      return <span className="text-gray-500/70">{word.text}</span>
    }

    // Current word with glide (wipe) animation
    const duration = word.end - word.start
    const progress = duration > 0 ? Math.max(0, Math.min(100, ((currentTime - word.start) / duration) * 100)) : 0

    return (
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
            transition: `width ${slideDuration}ms linear`,
            willChange: "width",
          }}
          className="text-white"
        >
          {word.text}
        </span>
      </span>
    )
  },
  (prev, next) => {
    // Custom comparison for performance
    // Only re-render if:
    // 1. It was active or is now active
    // 2. It was current or is now current
    // 3. Configuration changed
    if (prev.slideDuration !== next.slideDuration) return false
    if (prev.isLineActive !== next.isLineActive) return false

    // If line is not active, and it wasn't active, we don't need to check time
    if (!prev.isLineActive && !next.isLineActive) return true

    // If line is active, we need to check if time changed significantly or if it affects this word
    // But simpler: just check if time changed.
    // Since we want 60fps, we accept re-renders for active line words.
    return prev.currentTime === next.currentTime
  },
)

Word.displayName = "Word"

const Line = React.memo(
  ({
    line,
    index,
    activeLineIndex,
    currentTime,
    song_id,
    slideDuration,
  }: {
    line: LyricLine
    index: number
    activeLineIndex: number
    currentTime: number
    song_id?: string | number
    slideDuration?: number
  }) => {
    const isActive = index === activeLineIndex
    const isPast = index < activeLineIndex
    const isUpcoming = index > activeLineIndex

    const lineClass = `
      transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
      text-[1.6rem] md:text-[2.0rem] font-semibold leading-relaxed
      ${isActive ? "text-white scale-100" : "text-gray-400 scale-100"}
      ${isPast ? "opacity-50" : isUpcoming ? "opacity-60" : ""}
      ${isActive ? "drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]" : ""}
    `

    const lineStyle = {
      transform: `translateY(${isActive ? "0px" : isPast ? "-10px" : "10px"})`,
      filter: isActive ? "blur(0px)" : "blur(1.2px)",
      transition: "all 0.6s ease-out",
    }

    const effectiveTime = isActive ? currentTime : 0

    if (line.words && line.words.length > 0) {
      return (
        <p
          className={lineClass}
          style={{
            ...lineStyle,
            overflow: "hidden",
            wordWrap: "normal",
            wordBreak: "normal",
            whiteSpace: "normal",
            lineHeight: "1.3",
            textAlign: "left",
            display: "block",
          }}
        >
          {line.words.map((word, wi) => {
            const isLastWord = wi === line.words!.length - 1
            return (
              <React.Fragment key={`${song_id}-${index}-${wi}`}>
                <Word word={word} currentTime={effectiveTime} isLineActive={isActive} slideDuration={slideDuration} />
                {!isLastWord && " "}
              </React.Fragment>
            )
          })}
        </p>
      )
    }

    return (
      <p
        className={lineClass}
        style={{
          ...lineStyle,
          overflow: "hidden",
          wordWrap: "normal",
          wordBreak: "normal",
          whiteSpace: "normal",
          maxWidth: "90%",
          margin: "0 auto",
          letterSpacing: "0.25px",
          lineHeight: "1.3",
          textAlign: "left",
          display: "block",
        }}
      >
        {line.text}
      </p>
    )
  },
  (prev, next) => {
    // Only re-render if:
    // 1. Active state changes
    // 2. It IS active and time changes
    // 3. Config changes
    if (prev.activeLineIndex !== next.activeLineIndex) {
      // Check if this specific line's status changed (active <-> inactive <-> past)
      const prevStatus =
        prev.index === prev.activeLineIndex ? "active" : prev.index < prev.activeLineIndex ? "past" : "future"
      const nextStatus =
        next.index === next.activeLineIndex ? "active" : next.index < next.activeLineIndex ? "past" : "future"
      if (prevStatus !== nextStatus) return false
    }

    if (prev.slideDuration !== next.slideDuration) return false

    // If it is active, we need to re-render on time update
    if (prev.index === prev.activeLineIndex) {
      return prev.currentTime === next.currentTime
    }

    // Otherwise, ignore time updates
    return true
  },
)

Line.displayName = "Line"

export default function LyricsPlayer({
  lyrics = [],
  currentTime,
  activeLineIndex,
  setActiveLineIndex = () => {},
  isPlaying = true,
  song_id,
  slideDuration = 100, // Default smoothing
}: LyricsPlayerProps) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayLyrics, setDisplayLyrics] = useState(lyrics)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const prevsong_idRef = useRef(song_id)

  const memoizedLyrics = useMemo(() => displayLyrics, [displayLyrics])

  useEffect(() => {
    if (prevsong_idRef.current !== song_id && prevsong_idRef.current !== undefined) {
      setIsTransitioning(true)
      setTimeout(() => {
        setDisplayLyrics(lyrics)
        setActiveLineIndex(-1)
        setTimeout(() => setIsTransitioning(false), 250)
      }, 300)
    } else {
      setDisplayLyrics(lyrics)
    }
    prevsong_idRef.current = song_id
  }, [lyrics, song_id, setActiveLineIndex])

  useEffect(() => {
    if (!memoizedLyrics.length || isTransitioning) return

    // Find the current line index based on time
    let newIndex = -1
    for (let i = 0; i < memoizedLyrics.length; i++) {
      const start = memoizedLyrics[i].time
      const next = memoizedLyrics[i + 1]?.time ?? Number.POSITIVE_INFINITY
      if (currentTime >= start && currentTime < next) {
        newIndex = i
        break
      }
    }

    if (newIndex !== activeLineIndex) {
      setActiveLineIndex(newIndex)
    }
  }, [currentTime, memoizedLyrics, isTransitioning, activeLineIndex, setActiveLineIndex])

  useEffect(() => {
    if (activeLineIndex === -1 || !scrollContainerRef.current) return
    const activeLine = scrollContainerRef.current.children[activeLineIndex] as HTMLElement
    if (!activeLine) return
    scrollContainerRef.current.scrollTo({
      top: activeLine.offsetTop - scrollContainerRef.current.offsetHeight / 2 + activeLine.offsetHeight / 2,
      behavior: "smooth",
    })
  }, [activeLineIndex])

  const baseContainer =
    "h-full no-scrollbar overflow-y-auto scrollbar-none px-8 py-8 transition-all duration-500 ease-out text-center select-none"
  const fadeStyle = isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
  const inactiveOpacity = isPlaying ? "opacity-100" : "opacity-60"

  if (!memoizedLyrics.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>No lyrics available</p>
      </div>
    )
  }

  return (
    <div ref={scrollContainerRef} className={`${baseContainer} ${fadeStyle} ${inactiveOpacity}`}>
      {memoizedLyrics.map((line, i) => (
        <Line
          key={`${song_id}-${i}`}
          line={line}
          index={i}
          activeLineIndex={activeLineIndex || 0}
          currentTime={currentTime}
          song_id={song_id}
          slideDuration={slideDuration}
        />
      ))}
      <div className="h-32" />
    </div>
  )
}
