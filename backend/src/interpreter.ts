import OpenAI from 'openai';
import { OPENAI_API_KEY } from './config';
import { PersonaConfig, PersonaDelta } from './types';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const SYSTEM_PROMPT = `
You are a controller for a two-host AI newscast.
You must parse the user's command and output STRICT JSON for how to update personas and topic.

Schema (strict):
{
  "toneOnly": boolean,
  "topicOnly": boolean,
  "toneAndTopic": boolean,
  "personaDelta": {
    "personaA": {
      "style": string | null,
      "humour": string | null,
      "vibe": string | null
    },
    "personaB": {
      "style": string | null,
      "humour": string | null,
      "vibe": string | null
    },
    "globalTone": string | null
  },
  "newsTopic": string | null
}

Rules:
- If the user only changes tone/personality, set toneOnly=true, topicOnly=false.
- If they only change content (e.g. "show me soccer news"), set topicOnly=true.
- If they do both, set toneAndTopic=true.
- Always try to infer a reasonable newsTopic (e.g. "soccer", "AI", "Canada tech") if they ask for content.
- Do NOT add extra fields.
- If something is not changed, set it to null in personaDelta.
`;

export async function interpretCommand(command: string, currentPersona: PersonaConfig) {
  if (!OPENAI_API_KEY) {
    // fallback: naive heuristic
    return {
      toneOnly: false,
      topicOnly: true,
      toneAndTopic: false,
      personaDelta: {
        personaA: { style: null, humour: null, vibe: null },
        personaB: { style: null, humour: null, vibe: null },
        globalTone: null
      },
      newsTopic: command // treat as topic
    };
  }

  const userPrompt = `
		Current persona config (for context, do not just mirror):
		${JSON.stringify(currentPersona, null, 2)}

		User command:
		"${command}"

		Return ONLY valid JSON matching the schema.
	`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' }
  });

  const raw = completion.choices[0]?.message?.content;

  try {
    return JSON.parse(raw as string);
  } catch (e) {
    console.error('interpretCommand parse error', e, raw);
		
    // fallback: treat as topic-only
    return {
      toneOnly: false,
      topicOnly: true,
      toneAndTopic: false,
      personaDelta: {
        personaA: { style: null, humour: null, vibe: null },
        personaB: { style: null, humour: null, vibe: null },
        globalTone: null
      },
      newsTopic: command
    };
  }
}

export function applyPersonaDelta(currentPersona: PersonaConfig, delta: PersonaDelta) {
  const next = structuredClone(currentPersona);

  const { personaA, personaB, globalTone } = delta;

  if (personaA) {
    next.personaA.style = personaA.style ?? next.personaA.style;
    next.personaA.humour = personaA.humour ?? next.personaA.humour;
    next.personaA.vibe = personaA.vibe ?? next.personaA.vibe;
  }

  if (personaB) {
    next.personaB.style = personaB.style ?? next.personaB.style;
    next.personaB.humour = personaB.humour ?? next.personaB.humour;
    next.personaB.vibe = personaB.vibe ?? next.personaB.vibe;
  }

  if (globalTone !== null && globalTone !== undefined) {
    next.globalTone = globalTone;
  }
  return next;
}
