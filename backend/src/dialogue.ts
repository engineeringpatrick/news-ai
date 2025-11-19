import OpenAI from 'openai';
import { OPENAI_API_KEY } from './config';
import { NewsStory, PersonaConfig } from './types';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function generateDialogueLines(story: NewsStory, personaConfig: PersonaConfig) {
  if (!OPENAI_API_KEY) {
    // fallback: stub lines
    return [
      {
        speaker: 'A',
        text: `Stub line for: ${story.headline}`,
        sources: [story.url]
      },
      {
        speaker: 'B',
        text: `Stub reply to: ${story.headline}`,
        sources: [story.url]
      }
    ];
  }

  const systemPrompt = `
		You are a two-host newscast writer.
		You produce alternating dialogue lines for Host A and Host B about one news story.

		Persona configuration:
		Host A: name: $${personaConfig.personaA.name} style=${personaConfig.personaA.style}
		Host B: name: $${personaConfig.personaB.name} style=${personaConfig.personaB.style}

		Story facts (MUST GROUND ALL CLAIMS IN THESE FACTS):
		${story.facts}

		Output STRICT JSON:

		{
			"lines": [
				{
					"speaker": "A" | "B",
					"text": "1-3 sentences...",
					"sources": ["${story.url}"]
				},
				...
			]
		}

		Rules:
		- Alternate speakers: A, B, A, B...
		- 2-6 lines total, depending on richness of the story.
		- Natural banter is allowed, but all factual claims must come from the facts.
		- Keep each line short (no more than ~3 sentences).
		- Do not fabricate additional facts or sources.
		- The two hosts can converse and even call each out by their names.
	`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Generate dialogue now.' }
    ],
    response_format: { type: 'json_object' }
  });

  const raw = completion.choices[0]?.message?.content;
  const parsed = JSON.parse(raw as string);
  return parsed.lines || [];
}
