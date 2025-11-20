# News.AI

This is a simple two-host broadcast powered by AI. 

## How to use?
### Hosted solution
Can be used at https://news-ai-6dh.pages.dev/

### Local solution
```
git clone https://github.com/engineeringpatrick/news-ai/
npm news-ai
npm --prefix backend i
npm --prefix frontend i
npm --prefix backend run dev
npm --prefix frontend run dev
```

## Tech Stack
- [NewsAPI](https://newsapi.org/) for news retrieval.
- [OpenAI](https://platform.openai.com/docs/models) for NLP and dialogue generation.
- [Cartesia](https://cartesia.ai/sonic) for TTS.
- vite + react
- shadcn + tailwindcss
- node.js + express

## Architecture
