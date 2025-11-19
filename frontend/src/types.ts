export interface Persona {
  name: string;
  style: string;
  humour: string;
  vibe: string;
}

export interface PersonaConfig {
  personaA: Persona;
  personaB: Persona;
  globalTone: string;
}

export interface NewsStory {
  id: string;
  headline: string;
  summary: string;
  url: string;
  image: string | null;
  publisher: string;
  publishedAt: string;
  topics: string[];
  facts: string;
}

export interface DialogueLine {
  speaker: "A" | "B";
  text: string;
  sources: string[];
	audioBase64?: string,
  mime?: string | null
}

export interface RenderedItem {
  story: NewsStory;
  lines: DialogueLine[];
}

export type TranscriptLine = Omit<DialogueLine, 'audioBase64' | 'mime'>;
