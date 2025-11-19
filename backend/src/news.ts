import NewsAPI from 'ts-newsapi';
import { v4 as uuidv4 } from 'uuid';
import { NEWSAPI_KEY } from './config';

const newsAPI = new NewsAPI(NEWSAPI_KEY as string);

export async function fetchStoriesForTopic(topic = 'global', count = 3) {
	const isGeneric = topic === 'global';
  const data = isGeneric ? await newsAPI.getTopHeadlines({ pageSize: count }) : await newsAPI.getEverything({ q: topic, language: 'en', pageSize: count, sortBy: 'publishedAt' });

  // deduplicate by url + soft title match
  const seen = new Map();
  const stories = [];

  for (const a of data.articles) {
    if (!a.url) continue;
    const key = a.url;
    if (seen.has(key)) continue;
    seen.set(key, true);

    const headline = a.title || 'Untitled';
    const summary = a.description || a.content || '';
    const publisher = a.source?.name || 'Unknown';
    const image = a.urlToImage || null;
    const publishedAt = a.publishedAt || new Date().toISOString();

    const facts = [
      `Title: ${headline}`,
      publisher ? `Publisher: ${publisher}` : '',
      publishedAt ? `Published at: ${publishedAt}` : '',
      summary ? `Summary: ${summary}` : '',
      `URL: ${a.url}`
    ].filter(Boolean).join('\n');

    stories.push({
      id: uuidv4(),
      headline,
      summary,
      url: a.url,
      image,
      publisher,
      publishedAt,
      topics: topic && topic !== 'global' ? [topic] : [],
      facts
    });
  }

  return stories;
}

export async function fetchStories(topic = 'global', count = 3) {
  const stories = await fetchStoriesForTopic(topic, count);
  if (!stories.length) return null;
	
  return stories.slice(0, count);
}
