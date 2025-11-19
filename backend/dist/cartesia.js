"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ttsLines = ttsLines;
const cartesia_js_1 = require("@cartesia/cartesia-js");
const config_js_1 = require("./config.js");
const client = new cartesia_js_1.CartesiaClient({ apiKey: config_js_1.CARTESIA_API_KEY });
async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream)
        chunks.push(chunk);
    return Buffer.concat(chunks);
}
async function ttsLines(lines) {
    await client.auth.accessToken({
        grants: { stt: true },
        expiresIn: 60,
    });
    if (!config_js_1.CARTESIA_API_KEY) {
        return lines.map((line) => ({ ...line, audioBase64: null }));
    }
    const out = [];
    for (const line of lines) {
        const stream = await client.tts.bytes({
            modelId: "sonic-2",
            transcript: line.text,
            voice: {
                mode: "id",
                id: "694f9389-aac1-45b6-b726-9d9369183238",
            },
            language: "en",
            outputFormat: {
                container: "wav",
                sampleRate: 44100,
                encoding: "pcm_f32le",
            },
        });
        const buffer = await streamToBuffer(stream);
        out.push({
            ...line,
            audioBase64: buffer.toString("base64"),
        });
    }
    return out;
}
