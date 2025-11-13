import { ipcRenderer } from "electron";

export default function Utils() {}

export interface Track {
  song_id: number;
  song_name: string;
  artist_name: string;
  album: string;
  coverArtUrl: string;
  lyricsUrl?: string;
  song_length_sec: number;
}

export interface WordTiming {
  text: string;
  start: number; // Time in seconds
  end: number; // Time in seconds
}

// Represents a lyric line/paragraph (the output structure for LyricsPlayer)
export interface LyricLine {
  time: number; // Start time of the line/paragraph in seconds
  text: string; // Full text of the line/paragraph
  words?: WordTiming[]; // Optional: For character-synced TTML
}

export function parseTTML(ttmlContent: string): LyricLine[] {
  const parser = new DOMParser();
  const xml = parser.parseFromString(ttmlContent, "text/xml");
  const paragraphs = Array.from(xml.getElementsByTagName("p"));
  const lyrics: LyricLine[] = [];

  for (const p of paragraphs) {
    const start = parseTime(p.getAttribute("begin"));
    const end = parseTime(p.getAttribute("end"));

    // Word-synced case: <span begin=... end=...>word</span>
    const spans = Array.from(p.getElementsByTagName("span"));
    if (spans.length > 0) {
      let words: WordTiming[] = [];
      for (let i = 0; i < spans.length; i++) {
        let currentSpan = spans[i];
        let combinedText = (currentSpan.textContent || "").trim();
        let combinedStart = parseTime(currentSpan.getAttribute("begin")) ?? start;
        let combinedEnd = parseTime(currentSpan.getAttribute("end")) ?? end;
        let lastSpan = currentSpan;

        let j = i + 1;
        while (j < spans.length) {
          const nextSpan = spans[j];
          const nodeBetween = lastSpan.nextSibling;
          let shouldMerge = false;

          if (nodeBetween === nextSpan) {
            shouldMerge = true;
          } else if (nodeBetween && nodeBetween.nodeType === 3) {
            const cleaned = (nodeBetween.textContent || "").replace(/[\n\r\t\f\v]/g, "");
            if (cleaned === "") {
              shouldMerge = true;
            }
          }

          if (shouldMerge) {
            combinedText += (nextSpan.textContent || "").trim();
            combinedEnd = parseTime(nextSpan.getAttribute("end")) ?? end;
            lastSpan = nextSpan;
            j++;
          } else {
            break;
          }
        }

        words.push({
          text: combinedText,
          start: combinedStart,
          end: combinedEnd,
        });

        i = j - 1;
      }

      lyrics.push({
        time: start,
        text: words.map(w => w.text).join(" "),
        words,
      });
    } else {
      // Verse-synced line
      lyrics.push({
        time: start,
        text: (p.textContent || "").trim(),
      });
    }
  }

  // Sort by time just in case
  lyrics.sort((a, b) => a.time - b.time);
  return lyrics;
}

function parseTime(t?: string | null): number {
  if (!t) return 0;
  // TTML times are usually in format "0:00:12.345" or "75.3s"
  if (t.endsWith("s")) return parseFloat(t.replace("s", ""));
  const parts = t.split(":").map(parseFloat);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  return parseFloat(t);
}


function getNestedValue(obj: any, key: string): string | undefined {
  return key.split(".").reduce((acc, part) => acc?.[part], obj);
}

// This will read locale from registry (via preload)
async function getLocaleFromRegistry(): Promise<string> {
  try {
    const result = await (window as any).electronAPI.ReadLang();
    if (result.success) return result.value;
  } catch {}
  return "en"; // fallback
}

// Fetch locale JSON from public folder
async function loadLocaleData(locale: string): Promise<any> {
    const response = await fetch(`/locale/${locale}.json`);
    if (!response.ok) throw new Error("Locale file not found");
    return await response.json();
}

export async function parseStrToLocale(key: string): Promise<string> {
  const locale = await getLocaleFromRegistry();
  const data = await loadLocaleData(locale);

  const value = getNestedValue(data, key);
  if (value) return value;

  return key;
}
