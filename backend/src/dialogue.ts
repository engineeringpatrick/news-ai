import OpenAI from 'openai';
import {OPENAI_API_KEY} from './config';
import type {NewsStory, PersonaConfig} from './types';

const openai = new OpenAI({apiKey: OPENAI_API_KEY});

export function getSystemPrompt(
	story: NewsStory,
	personaConfig: PersonaConfig,
) {
	return `
		You are a newscast writer and you produce dialogue lines for one host for one news story.

		Host configuration:
			name: $${personaConfig.personaA.name} style=${personaConfig.personaA.style}

		Story facts (MUST GROUND ALL CLAIMS IN THESE FACTS):
		${story.facts}

		Output 2-6 lines total, depending on richness of the story. Do not fabricate additional facts or sources. Keep the style of the host.
	`;
}

export async function generateDialogueLines(
	story: NewsStory,
	personaConfig: PersonaConfig,
) {
	if (!OPENAI_API_KEY) {
		// fallback: stub lines
		return [
			{
				speaker: 'A',
				text: `Stub line for: ${story.headline}`,
				sources: [story.url],
			},
			{
				speaker: 'B',
				text: `Stub reply to: ${story.headline}`,
				sources: [story.url],
			},
		];
	}

	const completion = await openai.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: [
			{role: 'system', content: getSystemPrompt(story, personaConfig)},
			{role: 'user', content: 'Generate dialogue now.'},
		],
		response_format: {type: 'json_object'},
	});

	const raw = completion.choices[0]?.message?.content;
	const parsed = JSON.parse(raw as string);
	return parsed.lines || [];
}
