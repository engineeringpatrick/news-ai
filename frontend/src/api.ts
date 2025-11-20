import {getClientId} from './lib/utils';
import type {
	NewsStory,
	PersonaConfig,
	RenderedItem,
	TranscriptLine,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE;

interface UserCommandResponse {
	personaConfig: PersonaConfig;
	newsTopic: string;
	newStories: NewsStory[];
}

interface NextItemResponse {
	newStories: NewsStory[];
}

interface RenderItemResponse extends RenderedItem {}

export async function apiUserCommand(
	command: string,
	personaConfig: PersonaConfig,
	newsTopic: string,
): Promise<UserCommandResponse | null> {
	try {
		const res = await fetch(`${API_BASE}/api/user-command`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({
				clientId: getClientId(),
				command,
				personaConfig,
				newsTopic,
			}),
		});
		if (!res.ok) return null;
		const data = (await res.json()) as UserCommandResponse;
		return data;
	} catch (err) {
		console.error('apiUserCommand error', err);
		return null;
	}
}

export async function apiNextItems(
	newsTopic: string,
): Promise<NextItemResponse | null> {
	try {
		const res = await fetch(`${API_BASE}/api/next-items`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({newsTopic, clientId: getClientId()}),
		});
		if (!res.ok) return null;
		const data = (await res.json()) as NextItemResponse;
		return data;
	} catch (err) {
		console.error('apiNextItem error', err);
		return null;
	}
}

export async function apiRenderItem(
	story: NewsStory,
	personaConfig: PersonaConfig,
): Promise<RenderItemResponse | null> {
	try {
		const res = await fetch(`${API_BASE}/api/render-item`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({story, personaConfig}),
		});
		if (!res.ok) return null;
		const data = (await res.json()) as RenderItemResponse;
		return data;
	} catch (err) {
		console.error('apiRenderItem error', err);
		return null;
	}
}

export async function apiAppendTranscript(
	line: TranscriptLine,
	startMs: number,
	endMs: number,
): Promise<void> {
	try {
		await fetch(`${API_BASE}/api/transcript-append`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({line, startMs, endMs}),
		});
	} catch (err) {
		console.error('apiAppendTranscript error', err);
	}
}
