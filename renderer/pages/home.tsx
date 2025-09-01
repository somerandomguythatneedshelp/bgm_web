'use client';
import React, { use } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'
import { useState } from 'react'
import { useRef } from 'react'

export default function HomePage() {
  const [searchValue, setSearchValue] = useState('')
  const [playingValue, setPlayingValue] = useState('')
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:6767");
    ws.current = socket;

    socket.onopen = () => {
      console.log("Connected to C++ WebSocket");
      socket.send("heyy xx");
    };

    socket.onmessage = (event) => {
      console.log("Message from C++:", event.data);
      setPlayingValue(event.data); // ✅ update UI when C++ sends back
    };

    socket.onclose = () => {
      console.log("Connection closed");
    };

    return () => {
      socket.close();
    };
  }, []);

  const sendSearchQuery = (query: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(query);
    } else {
      console.log("WebSocket not connected");
    }
  }

  return (
    <React.Fragment>
      <Head>
        <title>tune</title>
      </Head>
        <div
  className="flex flex-col items-center justify-end w-screen h-screen"
  style={{ backgroundColor: "#000" }} // Enforce pure black
>
  <form method="GET">
    <div className="relative text-gray-400 focus-within:text-white">
      <span className="absolute inset-y-0 left-0 flex items-center pl-2 pb-10">
        <button
          type="submit"
          className="p-1 rounded-md bg-gray-900 border border-gray-600 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white shadow-md transition mb-6"
        >
          <svg
            fill="none"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="w-6 h-6"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </button>
      </span>
      <input
        type="search"
        name="q"
        value={searchValue}
        onChange={e => setSearchValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault(); 
            sendSearchQuery(searchValue); 
            setSearchValue('');
          }
        }}
        className="py-2 text-sm text-black bg-black rounded-md pl-12 border border-gray-700 focus:outline-none focus:bg-gray-50 focus:text-gray-900 w-full mb-6"
        placeholder="Search..."
        autoComplete="off"
      /> 
      <input 
      className="mt-2 mb-2"
      type="text"
      style={{ color: "#888", fontSize: "0.9em", backgroundColor: "#000", border: "none", outline: "none" }} // Match background color
      value={playingValue} readOnly
      />
    </div>
  </form>
</div>
    </React.Fragment>
  )
}
