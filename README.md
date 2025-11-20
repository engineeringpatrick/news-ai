# News.AI

This is a two-host news broadcast powered by AI, entirely customizable depending on the user's needs (e.g. you can make the newscasters fight if you want!)

<img width="1339" height="1272" alt="image" src="https://github.com/user-attachments/assets/a38c27e4-3d1e-483f-ae74-5fcdf518ccd6" />


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














