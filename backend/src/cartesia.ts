import { CartesiaClient } from "@cartesia/cartesia-js";
import { Readable } from "stream";
import { CARTESIA_API_KEY } from "./config";
import { DialogueLine } from "./types";

const client = new CartesiaClient({ apiKey: CARTESIA_API_KEY });

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export async function ttsLines(lines: DialogueLine[]) {
  await client.auth.accessToken({
    grants: { stt: true },
    expiresIn: 60,
  });

  if (!CARTESIA_API_KEY) {
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
      mime: "audio/wav"
    });
  }

  return out;
}
