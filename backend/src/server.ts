import cors from 'cors';
import express from 'express';
import {ttsLines} from './cartesia';
import {PORT} from './config';
import {generateDialogueLines} from './dialogue';
import {applyPersonaDelta, interpretCommand} from './interpreter';
import {fetchStoriesForTopic} from './news';
import {appendShowNote, appendTranscriptLine, appendVttEntry} from './storage';
import type {NewsStory} from './types';

const app = express();
app.use(cors());
app.use(express.json());

// default persona config if frontend doesn't provide one yet
function defaultPersonaConfig() {
	return {
		personaA: {
			name: 'Host A',
			style: 'factual, analytical, structured',
		},
		personaB: {
			name: 'Host B',
			style: 'bubbly, conversational',
		},
	};
}

// interpret user command + maybe return new news stories
app.post('/api/user-command', async (req, res) => {
	try {
		const {clientId, command, personaConfig, newsTopic} = req.body;
		const current = personaConfig || defaultPersonaConfig();

		const interpreted = await interpretCommand(command, current);
		const updatedPersona = applyPersonaDelta(current, interpreted.personaDelta);

		let stories: NewsStory[] = [];
		let updatedNewsTopic = newsTopic;
		if (!command || interpreted.topicOnly || interpreted.toneAndTopic) {
			updatedNewsTopic = interpreted.newsTopic || newsTopic;
			stories = (await fetchStoriesForTopic(
				clientId,
				updatedNewsTopic,
				6,
			)) as NewsStory[];
		}

		console.log(
			'interpreted command:',
			interpreted,
			' returning stories:',
			stories.length,
		);
		res.json({
			personaConfig: updatedPersona,
			newsTopic: updatedNewsTopic,
			newStories: stories,
		});
	} catch (e) {
		console.error('/api/user-command error', e);
		res.status(500).json({error: 'internal_error'});
	}
});

// queue refill: get an additional news story
app.post('/api/next-items', async (req, res) => {
	try {
		const {newsTopic, clientId} = req.body;
		const topic = newsTopic || 'global';

		const stories = await fetchStoriesForTopic(clientId, topic, 3);
		if (!stories) {
			return res.status(200).json({story: null});
		}

		res.json({newStories: stories});
	} catch (e) {
		console.error('/api/next-items error', e);
		res.status(500).json({error: 'internal_error'});
	}
});

// render-time dialogue + TTS for a given story
app.post('/api/render-item', async (req, res) => {
	try {
		const {story, personaConfig} = req.body;
		if (!story) return res.status(400).json({error: 'missing_story'});

		const current = personaConfig || defaultPersonaConfig();

		const lines = await generateDialogueLines(story, current);
		const withAudio = await ttsLines(lines);

		res.json({
			story,
			lines: withAudio,
		});
	} catch (e) {
		console.error('/api/render-item error', e);
		res.status(500).json({error: 'internal_error'});
	}
});

// transcript line append
app.post('/api/transcript-append', (req, res) => {
	try {
		const {line, startMs, endMs} = req.body;
		if (!line) return res.status(400).json({error: 'missing_line'});

		appendTranscriptLine(line);
		if (startMs != null && endMs != null) {
			appendVttEntry({startMs, endMs, text: line.text});
		}
		if (line.sources?.length) {
			appendShowNote(line.sources[0]);
		}

		res.json({ok: true});
	} catch (e) {
		console.error('/api/transcript-append error', e);
		res.status(500).json({error: 'internal_error'});
	}
});

app.listen(PORT, () => {
	console.log(`Backend listening on http://localhost:${PORT}`);
});
