import fs from 'fs';
import path from 'path';

declare const __dirname: string;
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const transcriptPath = path.join(OUTPUT_DIR, 'transcript.jsonl');
const vttPath = path.join(OUTPUT_DIR, 'episode.vtt');
const notesPath = path.join(OUTPUT_DIR, 'show_notes.md');

export function appendTranscriptLine(obj: any) {
  fs.appendFileSync(transcriptPath, JSON.stringify(obj) + '\n', 'utf8');
}

export function appendVttEntry({ startMs, endMs, text } : { startMs: number, endMs: number, text: string }) {
  // Very naive VTT formatting
  if (!fs.existsSync(vttPath)) {
    fs.writeFileSync(vttPath, 'WEBVTT\n\n', 'utf8');
  }
  const fmt = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    const msPart = String(ms % 1000).padStart(3, '0');
    return `${h}:${m}:${s}.${msPart}`;
  };

  const block = `${fmt(startMs)} --> ${fmt(endMs)}\n${text}\n\n`;
  fs.appendFileSync(vttPath, block, 'utf8');
}

export function appendShowNote(url: string) {
  const line = `- ${url}\n`;
  fs.appendFileSync(notesPath, line, 'utf8');
}
