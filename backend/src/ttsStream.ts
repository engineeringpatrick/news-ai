import type http from 'node:http';
import process from 'node:process';
import {CartesiaClient} from '@cartesia/cartesia-js';
import type {WordTimestamps} from '@cartesia/cartesia-js/api';
import type Source from '@cartesia/cartesia-js/wrapper/source';
import type {EmitteryCallbacks} from '@cartesia/cartesia-js/wrapper/utils';
import OpenAI from 'openai';
import {WebSocketServer} from 'ws';
import {getSystemPrompt} from './dialogue';

const cartesia = new CartesiaClient({apiKey: process.env.CARTESIA_API_KEY});
const openai = new OpenAI({apiKey: process.env.OPENAI_KEY});

const voices = [
	'5ee9feff-1265-424a-9d7f-8e4d431a12c7',
	'e07c00bc-4134-4eae-9ea4-1a55fb45746b',
];
export type CartesiaTtsStream = EmitteryCallbacks<{
	message: string;
	timestamps: WordTimestamps;
}> & {
	source: Source;
	stop: unknown;
};

export type ResultStream = {
	audio: string;
	text: string;
	speaker: string;
	done: boolean;
};

export function attachTTSStreamingWSS(server: http.Server) {
	const wss = new WebSocketServer({server, path: '/api/tts'});

	wss.on('connection', frontendWs => {
		let cartesiaWs: ReturnType<typeof cartesia.tts.websocket> | null = null;

		frontendWs.on('message', async raw => {
			const {newsStory, personaConfig, browserSampleRate} = JSON.parse(
				raw.toString(),
			);

			console.log('TTS stream request for input:', newsStory, personaConfig);
			if (!newsStory || !personaConfig) {
				console.error('Missing newsStory or personaConfig in TTS request');
				frontendWs.close();
				return;
			}

			// openai gpt streaming
			console.log('Starting OpenAI GPT stream for TTS...');
			const openaiStream = await openai.chat.completions.create({
				model: 'gpt-4o-mini',
				stream: true,
				messages: [
					{
						role: 'user',
						content: getSystemPrompt(newsStory, personaConfig),
					},
				],
			});

			// create cartesia websocket
			cartesiaWs = cartesia.tts.websocket({
				sampleRate: browserSampleRate,
				encoding: 'pcm_f32le',
				container: 'raw',
			});
			await cartesiaWs.connect();

			// we'll lazily send the first `send()` call once we see first GPT tokens
			let firstSend = true;
			let contextId: string = crypto.randomUUID();
			let transcript: string = '';

			// We track the active stream returned by `.send()`
			let ttsStream: CartesiaTtsStream | null = null;

			const sendToFrontend = (result: ResultStream) => {
				if (frontendWs.readyState === frontendWs.OPEN) {
					frontendWs.send(JSON.stringify(result));
				}
			};

			// handle audio / messages from cartesia stream
			const hookCartesiaEvents = (result: CartesiaTtsStream) => {
				result.on('message', (msg: string) => {
					const data = JSON.parse(msg);
					if (data.done) {
						contextId = ''; // reset context
					}

					sendToFrontend({
						audio: data.data ?? '',
						text: transcript,
						speaker: '',
						done: data.done,
					});
					transcript = '';
				});

				result.source.on('close', () => frontendWs.close());
			};

			// pipe gpt tokens into cartesia
			let buffer = '';
			for await (const chunk of openaiStream) {
				const delta = chunk.choices[0]?.delta?.content;
				transcript += delta;

				// buffer is to make sure we dont send punctuation chunks only, but we still keep them
				// if the buffer has a unicode character, we send it to Cartesia and we clear it
				// else, we continue until we have something that we can send to Cartesia
				buffer += delta;
				if (!/\p{L}+/u.test(buffer ?? '')) {
					continue;
				}

				if (firstSend) {
					firstSend = false;

					ttsStream = await cartesiaWs.send({
						modelId: 'sonic-2',
						transcript: buffer,
						voice: {id: voices[0], mode: 'id'},
						contextId: contextId,
						continue: true,
					});
					buffer = '';
					hookCartesiaEvents(ttsStream);
				} else {
					if (!contextId) {
						return;
					}

					await cartesiaWs.continue({
						modelId: 'sonic-2',
						voice: {id: voices[0], mode: 'id'},
						contextId: contextId,
						transcript: buffer,
					});
					buffer = '';
				}

				// todo - close stream
			}
		});

		frontendWs.on('close', () => {
			cartesiaWs?.disconnect();
		});
	});
}
