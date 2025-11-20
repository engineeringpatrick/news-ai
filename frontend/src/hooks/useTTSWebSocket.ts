import {useEffect, useRef, useState} from 'react';
import {AudioEngine} from '@/lib/audioEngine';
import type {NewsStory, PersonaConfig, ResultStream} from '@/types';

const API_BASE = import.meta.env.VITE_API_WEBSOCKET;

export function useTTSWebSocket() {
	const wsRef = useRef<WebSocket | null>(null);
	const audio = useRef<AudioEngine | null>(null);

	const [connected, setConnected] = useState(false);
	const [transcript, setTranscript] = useState<string[]>([]);
	const [volume, setVolume] = useState(0.5);
	const [isStoryPlaying, setIsStoryPlaying] = useState<boolean>(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: adding transcripts will break things
	useEffect(() => {
		audio.current = new AudioEngine();

		const ws = new WebSocket(`${API_BASE}/api/tts`);
		ws.binaryType = 'arraybuffer';
		wsRef.current = ws;

		ws.onopen = () => setConnected(true);
		ws.onclose = () => setConnected(false);

		ws.onmessage = ev => {
			const data: ResultStream = JSON.parse(ev.data);
			audio.current?.enqueue(data, setTranscript, transcript);
		};

		return () => ws.close();
	}, []);

	useEffect(() => {
		audio.current?.setVolume(volume);
	}, [volume]);

	return {
		connected,
		transcript,
		volume,
		setVolume,
		isStoryPlaying,
		setIsStoryPlaying,
		sendPayload(payload: {
			newsStory: NewsStory;
			personaConfig: PersonaConfig;
			browserSampleRate: number;
		}) {
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				wsRef.current.send(JSON.stringify(payload));
			}
		},
		pause() {
			audio.current?.pause();
		},

		resume() {
			audio.current?.resume();
		},

		stop() {
			audio.current?.stop();
		},

		clearTranscript() {
			setTranscript([]);
		},
	};
}
