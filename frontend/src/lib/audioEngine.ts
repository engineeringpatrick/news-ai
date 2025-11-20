// audioEngine.ts

import type {ResultStream} from '@/types';

function base64ToFloat32(base64: string): Float32Array {
	const binary = atob(base64);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	// Cartesia is sending 32-bit float little-endian
	return new Float32Array(bytes.buffer);
}

export class AudioEngine {
	private ctx: AudioContext;
	private gain: GainNode;
	private audioQueue: Float32Array[] = [];
	private textQueue: string = '';
	private isPlaying = false;

	constructor() {
		this.ctx = new AudioContext();
		this.gain = this.ctx.createGain();
		this.gain.connect(this.ctx.destination);
	}

	setVolume(v: number) {
		this.gain.gain.value = v;
	}

	pause() {
		this.ctx.suspend();
	}

	resume() {
		this.ctx.resume();
	}

	stop() {
		this.audioQueue = [];
		this.textQueue = '';
	}

	enqueue(
		data: ResultStream,
		setTranscript: React.Dispatch<React.SetStateAction<string[]>>,
		transcript: string[],
	) {
		if (data.audio) {
			const floats = base64ToFloat32(data.audio);
			this.audioQueue.push(floats);
			this.textQueue += data.text;
		}
		if (!this.isPlaying) this.flush(setTranscript, transcript);
	}

	private async flush(
		setTranscript: React.Dispatch<React.SetStateAction<string[]>>,
		transcript: string[],
	) {
		this.isPlaying = true;

		while (this.audioQueue.length > 0) {
			const floats = this.audioQueue.shift() as Float32Array<ArrayBufferLike>;

			const buf = this.ctx.createBuffer(1, floats.length, this.ctx.sampleRate);
			buf.getChannelData(0).set(floats);

			const src = this.ctx.createBufferSource();
			src.buffer = buf;
			src.connect(this.gain);

			const done = new Promise<void>(res => {
				src.onended = () => res();
			});

			src.start();
			setTranscript([...transcript, this.textQueue]);
			await done; // <- forces sequential playback
		}

		this.isPlaying = false;
	}
}
