# News.AI

This is a simple two-host broadcast powered by AI. 

<img width="1563" height="998" alt="image" src="https://github.com/user-attachments/assets/b79375e9-d904-4e82-be85-e4cf66ac4042" />



## How to use?
### Hosted solution
Can be used at https://news-ai-6dh.pages.dev/

### Local solution
```
git clone https://github.com/engineeringpatrick/news-ai/
cd news-ai
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
- biome for formatting and linting

## Architecture 
**the architecture below is subject to change - most logic will be moved to the backend and lines should be sent in chunk to minimize standby for the user**
- NLP processing, news fetching, dialogue generation and TTS generation is all done by the backend.
- Client keeps two queues of news stories. One containing raw facts (queue A), one containing dialogue lines and audio (queue B).
- If the user wants to change the tone, only queue B has to be re-computed. If the user wants to change news topic, or both, queue A will have to be cleared and recomputed.








