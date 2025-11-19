interface NewsStory {
  id: string,
  headline: string,
  summary: string,
  url: string,
  image: string | null,
  publisher: string,
  publishedAt: string,
  topics: string[],
  facts: string   // compact factual blob for LLM
}

interface PersonaConfig {
	personaA: { name: string, style: string, humour: string, vibe: string },
  personaB: { name: string, style: string, humour: string, vibe: string },
  globalTone: string,
}

interface DialogueLine {
	speaker: 'A' | 'B',
	text: string,
	sources: string[],
	audioBase64?: string | null,
  mime?: string | null
}

interface PersonaDelta {
	personaA: { style: string | null, humour: string | null, vibe: string | null } | null,
	personaB: { style: string | null, humour: string | null, vibe: string | null } | null,
	globalTone: string | null
}

export { DialogueLine, NewsStory, PersonaConfig, PersonaDelta };
