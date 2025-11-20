import NewsAPI from 'ts-newsapi';
import {v4 as uuidv4} from 'uuid';
import {NEWSAPI_KEY} from './config';
import type {NewsStory} from './types';

const newsAPI = new NewsAPI(NEWSAPI_KEY as string);
const pageState = new Map<string, Map<string, number>>();

function nextPage(clientId: string, topic: string) {
	let topics = pageState.get(clientId);
	if (!topics) {
		topics = new Map();
		pageState.set(clientId, topics);
	}

	const current = topics.get(topic) ?? 1;
	topics.set(topic, current + 1);
	return current;
}

export async function fetchStoriesForTopic(
	clientId: string,
	topic = 'global',
	count = 3,
) {
	const isGeneric = topic === 'global';
	const page = nextPage(clientId, topic);
	const data = isGeneric
		? await newsAPI.getTopHeadlines({pageSize: count, page: page})
		: await newsAPI.getEverything({
				q: topic,
				language: 'en',
				pageSize: count,
				sortBy: 'publishedAt',
				page: page,
			});

	// deduplicate by url + soft title match
	const seen = new Map();
	const stories: NewsStory[] = [];
	for (const a of data.articles) {
		if (!a.url) continue;
		const key = a.title;
		if (seen.has(key)) {
			continue;
		}
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
			`URL: ${a.url}`,
		]
			.filter(Boolean)
			.join('\n');

		stories.push({
			id: uuidv4(),
			headline,
			summary,
			url: a.url,
			image,
			publisher,
			publishedAt,
			topics: topic && topic !== 'global' ? [topic] : [],
			facts,
		});
	}

	return stories;
}
