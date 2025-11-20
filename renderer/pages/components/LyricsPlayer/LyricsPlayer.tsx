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
  slideDuration?: number
}

const Word = React.memo(
  ({
    word,
    isLineActive,
    slideDuration = 100,
  }: {
    word: WordTiming
    isLineActive: boolean
    slideDuration?: number
  }) => {
    // If line is not active, we render a static state to save resources
    if (!isLineActive) {
      return <span className="text-gray-500/70">{word.text}</span>
    }

    // We use CSS variables for the start and duration to let the browser handle the math
    // This avoids React re-renders for every frame of the animation
    const duration = word.end - word.start

    return (
      <span
        className="relative inline-block whitespace-normal break-normal"
        style={
          {
            "--word-start": word.start,
            "--word-duration": duration,
          } as React.CSSProperties
        }
      >
        {/* Background layer (inactive text) */}
        <span className="text-gray-500/70">{word.text}</span>

        {/* Foreground layer (active text with wipe) */}
        <span
          className="absolute left-0 top-0 overflow-hidden text-white whitespace-nowrap"
          style={{
            // Calculate width based on the parent line's --current-time variable
            // Formula: (currentTime - start) / duration * 100%
            // We clamp it between 0% and 100%
            width: `clamp(0%, calc((var(--current-time) - var(--word-start)) / var(--word-duration) * 100%), 100%)`,
            // Add a small transition to smooth out frame jitters, but keep it fast enough for rapid words
            transition: `width ${slideDuration}ms linear`,
            willChange: "width",
          }}
        >
          {word.text}
        </span>
      </span>
    )
  },
  (prev, next) => {
    // Only re-render if active state or config changes
    // We NO LONGER check currentTime here, as it's passed via CSS variable
    return (
      prev.isLineActive === next.isLineActive && prev.slideDuration === next.slideDuration && prev.word === next.word
    )
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
      "--current-time": isActive ? currentTime : 0,
    } as React.CSSProperties

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
                <Word word={word} isLineActive={isActive} slideDuration={slideDuration} />
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
    if (prev.activeLineIndex !== next.activeLineIndex) {
      const prevStatus =
        prev.index === prev.activeLineIndex ? "active" : prev.index < prev.activeLineIndex ? "past" : "future"
      const nextStatus =
        next.index === next.activeLineIndex ? "active" : next.index < next.activeLineIndex ? "past" : "future"
      if (prevStatus !== nextStatus) return false
    }

    if (prev.slideDuration !== next.slideDuration) return false

    // If it is active, we need to re-render to update the CSS variable
    if (prev.index === prev.activeLineIndex) {
      return prev.currentTime === next.currentTime
    }

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
  slideDuration = 100,
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
