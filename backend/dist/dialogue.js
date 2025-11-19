"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDialogueLines = generateDialogueLines;
const openai_1 = __importDefault(require("openai"));
const config_js_1 = require("./config.js");
const openai = new openai_1.default({ apiKey: config_js_1.OPENAI_API_KEY });
async function generateDialogueLines(story, personaConfig) {
    if (!config_js_1.OPENAI_API_KEY) {
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
		Host A: style=${personaConfig.personaA.style}, humour=${personaConfig.personaA.humour}, vibe=${personaConfig.personaA.vibe}
		Host B: style=${personaConfig.personaB.style}, humour=${personaConfig.personaB.humour}, vibe=${personaConfig.personaB.vibe}
		Global tone: ${personaConfig.globalTone}

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
		- 2 to 5 lines total, depending on richness of the story.
		- Natural banter is allowed, but all factual claims must come from the facts.
		- Include at least one [src] marker in each line to indicate citation, e.g. "according to [src]".
		- Keep each line short (no more than ~3 sentences).
		- Do not fabricate additional facts or sources.
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
    const parsed = JSON.parse(raw);
    return parsed.lines || [];
}
