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

export interface LyricLine {
  time: number;
  text: string;
  words?: WordTiming[];
  isAdlib?: boolean;
}

export function parseTTML(ttmlContent: string): LyricLine[] {
  const parser = new DOMParser();
  const xml = parser.parseFromString(ttmlContent, "text/xml");
  const paragraphs = Array.from(xml.getElementsByTagName("p"));
  const lyrics: LyricLine[] = [];

  for (const p of paragraphs) {
    const pStart = parseTime(p.getAttribute("begin"));
    const pEnd = parseTime(p.getAttribute("end"));
    const spans = Array.from(p.getElementsByTagName("span"));

    if (spans.length > 0) {
      let currentLineWords: WordTiming[] = [];

      spans.forEach((span) => {
        const text = span.childNodes[0]?.nodeValue || span.textContent || "";
        const start = parseTime(span.getAttribute("begin")) ?? pStart;
        const end = parseTime(span.getAttribute("end")) ?? pEnd;

        // Detection logic: If word starts with "(" or follows an existing bracketed section
        const isBrackets = text.trim().startsWith("(") || text.trim().endsWith(")");

        if (isBrackets && currentLineWords.length > 0 && !currentLineWords[0].text.includes("(")) {
          // Push existing main line words before starting the adlib line
          lyrics.push({
            time: currentLineWords[0].start,
            text: currentLineWords.map(w => w.text).join(""),
            words: [...currentLineWords],
            isAdlib: false
          });
          currentLineWords = [];
        }

        currentLineWords.push({ text, start, end });
      });

      // Push remaining words
      if (currentLineWords.length > 0) {
        lyrics.push({
          time: currentLineWords[0].start,
          text: currentLineWords.map(w => w.text).join(""),
          words: currentLineWords,
          isAdlib: currentLineWords[0].text.trim().startsWith("(")
        });
      }
    }
  }

  return lyrics.sort((a, b) => a.time - b.time);
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
