interface NewsStory {
	id: string;
	headline: string;
	summary: string;
	url: string;
	image: string | null;
	publisher: string;
	publishedAt: string;
	topics: string[];
	facts: string; // compact factual blob for LLM
}

interface PersonaConfig {
	personaA: {name: string; style: string};
	personaB: {name: string; style: string};
}

interface DialogueLine {
	speaker: 'A' | 'B';
	text: string;
	sources: string[];
	audioBase64?: string | null;
	mime?: string | null;
}

interface PersonaDelta {
	personaA: {style: string | null} | null;
	personaB: {style: string | null} | null;
}
interface ResultStream {
	audio: string;
	text: string;
	speaker: string;
}
type TranscriptLine = Omit<DialogueLine, 'audioBase64' | 'mime'>;

export type {
	ResultStream,
	DialogueLine,
	NewsStory,
	PersonaConfig,
	PersonaDelta,
	TranscriptLine,
};
