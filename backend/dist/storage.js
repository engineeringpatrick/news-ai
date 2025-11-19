"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendTranscriptLine = appendTranscriptLine;
exports.appendVttEntry = appendVttEntry;
exports.appendShowNote = appendShowNote;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const OUTPUT_DIR = path_1.default.join(__dirname, '..', 'output');
if (!fs_1.default.existsSync(OUTPUT_DIR)) {
    fs_1.default.mkdirSync(OUTPUT_DIR, { recursive: true });
}
const transcriptPath = path_1.default.join(OUTPUT_DIR, 'transcript.jsonl');
const vttPath = path_1.default.join(OUTPUT_DIR, 'episode.vtt');
const notesPath = path_1.default.join(OUTPUT_DIR, 'show_notes.md');
function appendTranscriptLine(obj) {
    fs_1.default.appendFileSync(transcriptPath, JSON.stringify(obj) + '\n', 'utf8');
}
function appendVttEntry({ startMs, endMs, text }) {
    // Very naive VTT formatting
    if (!fs_1.default.existsSync(vttPath)) {
        fs_1.default.writeFileSync(vttPath, 'WEBVTT\n\n', 'utf8');
    }
    const fmt = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        const msPart = String(ms % 1000).padStart(3, '0');
        return `${h}:${m}:${s}.${msPart}`;
    };
    const block = `${fmt(startMs)} --> ${fmt(endMs)}\n${text}\n\n`;
    fs_1.default.appendFileSync(vttPath, block, 'utf8');
}
function appendShowNote(url) {
    const line = `- ${url}\n`;
    fs_1.default.appendFileSync(notesPath, line, 'utf8');
}
