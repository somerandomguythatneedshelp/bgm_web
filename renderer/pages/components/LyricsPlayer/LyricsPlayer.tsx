import React, { useEffect, useRef, useState } from "react"

interface LyricLine {
  time: number
  text: string
}

interface LyricsPlayerProps {
  lyrics: LyricLine[]
  currentTime: number
  isPlaying?: boolean
  song_id?: string | number 
}

export default function LyricsPlayer ({ lyrics, currentTime, isPlaying = true, song_id }: LyricsPlayerProps) {
  const [activeLineIndex, setActiveLineIndex] = useState(-1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayLyrics, setDisplayLyrics] = useState(lyrics)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const prevsong_idRef = useRef(song_id)

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
    if (prevsong_idRef.current !== song_id && prevsong_idRef.current !== undefined) {
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

    prevsong_idRef.current = song_id
  }, [lyrics, song_id])

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
          <p className="text-lg select-none">No lyrics available</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{customScrollbarStyles}</style>
      <div
        ref={scrollContainerRef}
        className={`h-full overflow-y-auto px-6 py-8 scrollbar-custom transition-all duration-500 ease-out ${
          isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
        } ${!isPlaying ? "opacity-60" : ""}`}
      >
        {displayLyrics.map((line, index) => {
          const isActive = index === activeLineIndex && !isTransitioning
          const isPast = index < activeLineIndex && !isTransitioning
          const isUpcoming = index > activeLineIndex && !isTransitioning

          return (
            <p
              key={`${song_id}-${index}`}
              className={`select-none transition-all duration-700 ease-out text-xl md:text-3xl py-3 px-4 font-medium leading-relaxed transform ${
                isActive ? "text-white scale-105 opacity-100 translate-y-0" : "scale-100 translate-y-0"
              } ${
                isPast
                  ? "text-gray-500 opacity-55"
                  : isUpcoming
                    ? "text-gray-400 opacity-60"
                    : "text-gray-400 opacity-70"
              }`}
              style={{
                filter: isActive ? "blur(0px)" : "blur(0.9px)",
                textShadow: isActive ? "0 0 30px rgba(33, 31, 36, 0.4), 0 0 60px rgba(54, 51, 51, 0.2)" : "none",
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