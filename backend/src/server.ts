import cors from 'cors';
import express from 'express';
import { ttsLines } from './cartesia';
import { PORT } from './config';
import { generateDialogueLines } from './dialogue';
import { applyPersonaDelta, interpretCommand } from './interpreter';
import { fetchSingleStory } from './news';
import { appendShowNote, appendTranscriptLine, appendVttEntry } from './storage';

const app = express();
app.use(cors());
app.use(express.json());

// Default persona config if frontend doesn't provide one yet
function defaultPersonaConfig() {
  return {
    personaA: {
      name: 'Host A',
      style: 'factual, analytical, structured',
      humour: 'minimal, dry',
      vibe: 'calm, precise'
    },
    personaB: {
      name: 'Host B',
      style: 'bubbly, conversational',
      humour: 'light, friendly jokes',
      vibe: 'warm, energetic'
    },
    globalTone: 'neutral',
  };
}

// 1) Interpret user command + maybe return new news stories
app.post('/api/user-command', async (req, res) => {
  console.log("api/user-command called with", req.body);
  try {
    const { command, personaConfig } = req.body;
    const current = personaConfig || defaultPersonaConfig();

    const interpreted = await interpretCommand(command, current);
    const updatedPersona = applyPersonaDelta(current, interpreted.personaDelta);

    let newsTopic = current.newsTopic || 'global';
    let stories = [];
    console.log('interpreted command', interpreted);
    if (interpreted.topicOnly || interpreted.toneAndTopic) {
      newsTopic = interpreted.newsTopic || newsTopic;

      const story = await fetchSingleStory(newsTopic);
      console.log('fetched story for topic', newsTopic, story ? story.headline : 'none');
      if (story) stories.push(story);
    }

    res.json({
      personaConfig: updatedPersona,
      newsTopic,
      newStories: stories
    });
  } catch (e) {
    console.error('/api/user-command error', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

// 2) Queue refill: get an additional news story
app.post('/api/next-item', async (req, res) => {
  console.log("api/next-item called with", req.body);
  try {
    const { newsTopic } = req.body;
    const topic = newsTopic || 'global';

    const story = await fetchSingleStory(topic);
    if (!story) {
      return res.status(200).json({ story: null });
    }

    res.json({ story });
  } catch (e) {
    console.error('/api/next-item error', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

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
