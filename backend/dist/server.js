"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const cartesia_js_1 = require("./cartesia.js");
const config_js_1 = require("./config.js");
const dialogue_js_1 = require("./dialogue.js");
const interpreter_js_1 = require("./interpreter.js");
const news_js_1 = require("./news.js");
const storage_js_1 = require("./storage.js");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
        newsTopic: 'global'
    };
}
// 1) Interpret user command + maybe return new news stories
app.post('/api/user-command', async (req, res) => {
    console.log("api/user-command called");
    try {
        const { command, personaConfig } = req.body;
        const current = personaConfig || defaultPersonaConfig();
        const interpreted = await (0, interpreter_js_1.interpretCommand)(command, current);
        const updatedPersona = (0, interpreter_js_1.applyPersonaDelta)(current, interpreted.personaDelta);
        let newsTopic = current.newsTopic || 'global';
        let stories = [];
        console.log("hi");
        if (interpreted.topicOnly || interpreted.toneAndTopic) {
            newsTopic = interpreted.newsTopic || newsTopic;
            const story = await (0, news_js_1.fetchSingleStory)(newsTopic);
            console.log('fetched story for topic', newsTopic, story ? story.headline : 'none');
            if (story)
                stories.push(story);
        }
        res.json({
            personaConfig: updatedPersona,
            newsTopic,
            newStories: stories
        });
    }
    catch (e) {
        console.error('/api/user-command error', e);
        res.status(500).json({ error: 'internal_error' });
    }
});
// 2) Queue refill: get an additional news story
app.post('/api/next-item', async (req, res) => {
    try {
        const { personaConfig } = req.body;
        const current = personaConfig || defaultPersonaConfig();
        const topic = current.newsTopic || 'global';
        const story = await (0, news_js_1.fetchSingleStory)(topic);
        if (!story) {
            return res.status(200).json({ story: null });
        }
        res.json({ story });
    }
    catch (e) {
        console.error('/api/next-item error', e);
        res.status(500).json({ error: 'internal_error' });
    }
});
// 3) Render-time dialogue + TTS for a given story
app.post('/api/render-item', async (req, res) => {
    try {
        const { story, personaConfig } = req.body;
        if (!story)
            return res.status(400).json({ error: 'missing_story' });
        const current = personaConfig || defaultPersonaConfig();
        const lines = await (0, dialogue_js_1.generateDialogueLines)(story, current);
        const withAudio = await (0, cartesia_js_1.ttsLines)(lines);
        res.json({
            story,
            lines: withAudio
        });
    }
    catch (e) {
        console.error('/api/render-item error', e);
        res.status(500).json({ error: 'internal_error' });
    }
});
// 4) Transcript line append
app.post('/api/transcript-append', (req, res) => {
    try {
        const { line, startMs, endMs } = req.body;
        if (!line)
            return res.status(400).json({ error: 'missing_line' });
        (0, storage_js_1.appendTranscriptLine)(line);
        if (startMs != null && endMs != null) {
            (0, storage_js_1.appendVttEntry)({ startMs, endMs, text: line.text });
        }
        if (line.sources && line.sources.length) {
            (0, storage_js_1.appendShowNote)(line.sources[0]);
        }
        res.json({ ok: true });
    }
    catch (e) {
        console.error('/api/transcript-append error', e);
        res.status(500).json({ error: 'internal_error' });
    }
});
app.listen(config_js_1.PORT, () => {
    console.log(`Backend listening on http://localhost:${config_js_1.PORT}`);
});
