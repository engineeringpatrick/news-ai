import cors from 'cors';
import express from 'express';
import { ttsLines } from './cartesia';
import { PORT } from './config';
import { generateDialogueLines } from './dialogue';
import { applyPersonaDelta, interpretCommand } from './interpreter';
import { fetchStories } from './news';
import { appendShowNote, appendTranscriptLine, appendVttEntry } from './storage';
import { NewsStory } from './types';

const app = express();
app.use(cors());
app.use(express.json());

// Default persona config if frontend doesn't provide one yet
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

// 1) Interpret user command + maybe return new news stories
app.post('/api/user-command', async (req, res) => {
  console.log("api/user-command called with", req.body);
  try {
    const { command, personaConfig, newsTopic } = req.body;
    const current = personaConfig || defaultPersonaConfig();

    const interpreted = await interpretCommand(command, current);
    const updatedPersona = applyPersonaDelta(current, interpreted.personaDelta);

    let stories: NewsStory[] = [];
    let updatedNewsTopic = newsTopic;
    if (interpreted.topicOnly || interpreted.toneAndTopic) {
      updatedNewsTopic = interpreted.newsTopic || newsTopic;
      stories = await fetchStories(updatedNewsTopic, 6) as NewsStory[];
    }
    
    res.json({
      personaConfig: updatedPersona,
      newsTopic: updatedNewsTopic,
      newStories: stories
    });
  } catch (e) {
    console.error('/api/user-command error', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

// 2) Queue refill: get an additional news story
app.post('/api/next-items', async (req, res) => {
  console.log("api/next-items called with", req.body);
  try {
    const { newsTopic } = req.body;
    const topic = newsTopic || 'global';

    const stories = await fetchStories(topic, 3);
    console.log(`fetched ${stories?.length || 0} stories for topic "${topic}"`);
    if (!stories) {
      return res.status(200).json({ story: null });
    }

    res.json({ snewStories: stories });
  } catch (e) {
    console.error('/api/next-items error', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

const getFromFile = () => {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, 'dummy_render_item_response.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}
// 3) Render-time dialogue + TTS for a given story
app.post('/api/render-item', async (req, res) => {
  console.log("api/render-item called");
  try {
    const { story, personaConfig } = req.body;
    if (!story) return res.status(400).json({ error: 'missing_story' });

    const current = personaConfig || defaultPersonaConfig();

    const lines = await generateDialogueLines(story, current);
    const withAudio = await ttsLines(lines);

    console.log("returning the following lines: ");
    for (const line of withAudio) {
      console.log(`- ${line.speaker}: ${line.text} [audio: ${line.audioBase64 ? 'yes' : 'no'}]`);
    }
    res.json({
      story,
      lines: withAudio
    });
  } catch (e) {
    console.error('/api/render-item error', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

// 4) Transcript line append
app.post('/api/transcript-append', (req, res) => {
  try {
    const { line, startMs, endMs } = req.body;
    if (!line) return res.status(400).json({ error: 'missing_line' });

    appendTranscriptLine(line);
    if (startMs != null && endMs != null) {
      appendVttEntry({ startMs, endMs, text: line.text });
    }
    if (line.sources && line.sources.length) {
      appendShowNote(line.sources[0]);
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('/api/transcript-append error', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
