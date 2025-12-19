"use client"

import React, { useEffect, useRef, useState } from "react"

export interface WordTiming {
  text: string
  start: number
  end: number
}

export interface LyricLine {
  time: number
  text: string
  words?: WordTiming[]
  isAdlib?: boolean
}

interface LyricsPlayerProps {
  lyrics: LyricLine[]
  currentTime: number
  isPlaying?: boolean
  song_id?: string | number
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const Word = React.memo(({ word, currentTime, slideDuration = 60 }: { word: WordTiming; currentTime: number; slideDuration?: number }) => {
  const duration = word.end - word.start
  const progress = clamp((currentTime - word.start) / duration, 0, 1) * 100

  return (
    <span className="relative inline-block whitespace-nowrap">
      <span className="opacity-30">{word.text}</span>
      <span
        className="absolute inset-0 text-white"
        style={{
          clipPath: `inset(0 ${100 - progress}% 0 0)`,
          transition: `clip-path ${slideDuration}ms linear`,
          willChange: "clip-path",
        }}
        aria-hidden="true"
      >
        {word.text}
      </span>
    </span>
  )
})

const Line = React.memo(
  ({ line, currentTime, nextMainLineTime, song_id }: { line: LyricLine; currentTime: number; nextMainLineTime?: number; song_id?: string | number }) => {
    const lineStart = line.time;
    
    // Logic Fix: A main line should stay active until the NEXT main line starts.
    // An adlib should only be active during its specific word/time window.
    const lineEnd = line.isAdlib 
      ? (line.words?.[line.words.length - 1]?.end ?? lineStart + 2) // Adlibs are short-lived
      : (nextMainLineTime ?? Infinity); // Main lines last until the next main line

    const isActive = currentTime >= lineStart && currentTime < lineEnd;
    const hasStarted = currentTime >= lineStart;

    const lineClass = `
      transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
      leading-relaxed select-none text-left mb-4
      ${line.isAdlib ? "text-[1.2rem] md:text-[1.5rem] font-medium italic" : "text-[1.6rem] md:text-[2rem] font-semibold"}
      ${isActive ? "text-white opacity-100" : "text-gray-400 opacity-40"}
      ${isActive && !line.isAdlib ? "drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]" : ""}
    `;

    const lineStyle = {
      // We only blur if the line hasn't started yet or has already passed
      filter: `blur(${isActive ? 0 : 2}px)`,
      transform: `scale(${isActive ? 1 : 0.98})`,
      transition: "all 0.7s cubic-bezier(0.4,0,0.2,1)",
    } as React.CSSProperties;

    return (
      <p className={lineClass} style={lineStyle}>
        {line.words && line.words.length > 0 ? (
          line.words.map((word, wi) => (
            <React.Fragment key={`${song_id}-${wi}`}>
              <Word word={word} currentTime={currentTime} />
              {wi < line.words!.length - 1 && " "}
            </React.Fragment>
          ))
        ) : (
          line.text
        )}
      </p>
    );
  }
);
export default function LyricsPlayer({ lyrics = [], currentTime, isPlaying = true, song_id }: LyricsPlayerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Scroll only follows main verse lines
  useEffect(() => {
    if (!scrollContainerRef.current) return
    const mainIndex = lyrics.findIndex((l, i) => !l.isAdlib && currentTime >= l.time && currentTime < (lyrics[i + 1]?.time ?? Infinity))
    if (mainIndex === -1) return
    const lineEl = scrollContainerRef.current.children[mainIndex] as HTMLElement
    if (!lineEl) return
    scrollContainerRef.current.scrollTo({
      top: lineEl.offsetTop - scrollContainerRef.current.offsetHeight / 2 + lineEl.offsetHeight / 2,
      behavior: "smooth",
    })
  }, [currentTime, lyrics])

  return (
    <div ref={scrollContainerRef} className="h-full no-scrollbar scrollbar-none overflow-y-auto px-8 py-8 text-center select-none">
      {lyrics.map((line, i) => (
        <Line key={`${song_id}-${i}`} line={line} currentTime={currentTime} song_id={song_id} />
      ))}
      <div className="h-32" />
    </div>
  )
}
