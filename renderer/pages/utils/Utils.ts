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

const parseSRT = (srtText: string) => {
    if (!srtText) return [];

    const lines = srtText.split(/\r?\n/);
    const result = [];
    let i = 0;

    while (i < lines.length) {
        // Skip empty lines
        if (!lines[i]?.trim()) {
            i++;
            continue;
        }

        // 1. Find Index Line (we can skip it if it's just a number)
        const indexLine = lines[i];
        if (!/^\d+$/.test(indexLine.trim())) {
            i++; // Not a valid block, skip
            continue;
        }
        i++;

        // 2. Find Time Line
        const timeLine = lines[i]?.trim();
        if (!timeLine || timeLine.indexOf('-->') === -1) {
            i++; // Not a valid time line, skip
            continue;
        }
        i++;
        
        const timeMatch = timeLine.match(/(\d+):(\d+):(\d+),(\d+)/); // Find start time
        if (!timeMatch) {
            i++; // Invalid time format
            continue;
        }

        const startTimeSec = 
            parseInt(timeMatch[1]) * 3600 +
            parseInt(timeMatch[2]) * 60 +
            parseInt(timeMatch[3]) +
            parseInt(timeMatch[4]) / 1000;

        // 3. Read Text Lines (one or more)
        let textLines: string[] = [];
        while (lines[i] && lines[i].trim() !== "") {
            textLines.push(lines[i].trim());
            i++;
        }

        if (textLines.length > 0) {
            result.push({
                time: startTimeSec,
                text: textLines.join('\n') // Join multi-lines with a newline
            });
        }
    }

    return result;
};

export { parseSRT };

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
