"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchStoriesForTopic = fetchStoriesForTopic;
exports.fetchSingleStory = fetchSingleStory;
const ts_newsapi_1 = __importDefault(require("ts-newsapi"));
const uuid_1 = require("uuid");
const config_js_1 = require("./config.js");
const newsAPI = new ts_newsapi_1.default(config_js_1.NEWSAPI_KEY);
async function fetchStoriesForTopic(topic = 'global') {
    const isGeneric = topic === 'global';
    const data = isGeneric ? await newsAPI.getTopHeadlines({ pageSize: 10 }) : await newsAPI.getEverything({ q: topic, language: 'en', pageSize: 10, sortBy: 'publishedAt' });
    // Deduplicate by url + soft title match
    const seen = new Map();
    const stories = [];
    for (const a of data.articles) {
        if (!a.url)
            continue;
        const key = a.url;
        if (seen.has(key))
            continue;
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
            id: (0, uuid_1.v4)(),
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
async function fetchSingleStory(topic = 'global') {
    const stories = await fetchStoriesForTopic(topic);
    if (!stories.length)
        return null;
    return stories[0];
}
