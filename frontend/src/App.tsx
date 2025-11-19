import React, { useState } from "react";
import { apiUserCommand } from "./api";
import Controls from "./components/Controls";
import NowPlaying from "./components/NowPlaying";
import QueueSidebar from "./components/QueueSidebar";
import Transcript from "./components/Transcript";
import { useAudioScheduler } from "./hooks/useAudioScheduler";
import { usePersistedState } from "./hooks/usePersistedState";
import type { NewsStory, PersonaConfig, TranscriptLine } from "./types";

const defaultPersona: PersonaConfig = {
  personaA: {
    name: "Host A",
    style: "factual, analytical, structured",
    humour: "minimal, dry",
    vibe: "calm, precise"
  },
  personaB: {
    name: "Host B",
    style: "bubbly, conversational",
    humour: "light, friendly jokes",
    vibe: "warm, energetic"
  },
  globalTone: "neutral",
};

const App: React.FC = () => {
  const [personaConfig, setPersonaConfig] = usePersistedState<PersonaConfig>("personaConfig", defaultPersona);
  const [newsTopic, setNewsTopic] = usePersistedState<string>("newsTopic", "global");
  const [queue, setQueue] = useState<NewsStory[]>([]);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const { nowPlaying, start, stop, skipLine, skipStory } = useAudioScheduler({
    queue,
    setQueue,
    setTranscript,
    isPlaying,
    setIsPlaying,
    personaConfig,
    newsTopic,
  });

  const handleCommand = async (command: string) => {
    const data = await apiUserCommand(command, personaConfig);
    if (!data) return;

    console.log("api/user-command response", data);
    const { personaConfig: updatedPersona, newsTopic, newStories } = data;

    // persona + topic
    setPersonaConfig((prev) => ({
      ...prev,
      ...updatedPersona,
    }));
    setNewsTopic(newsTopic);

    if (newStories && newStories.length > 0) {
      setQueue((prevQueue) => {
        if (prevQueue.length === 0) {
          return [...newStories];
        }
        const [current, ...rest] = prevQueue;
        return current ? [current, ...newStories, ...rest] : [...newStories, ...rest];
      });
    }
    else {
      setIsPlaying(false);
    }
  };

  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: 1200,
        margin: "0 auto"
      }}
    >
      <h1 style={{ marginTop: 0, marginBottom: "0.25rem" }}>Welcome to News.AI</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.75, marginTop: 0 }}>
        Click <strong>Start</strong> once, then type requests like “soccer news”, “less snark”, or “more numbers”.
      </p>

      <Controls onStart={start} onCommand={handleCommand} isPlaying={isPlaying} pause={stop} resume={start} skipLine={skipLine} skipStory={skipStory}/>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "1rem",
          marginTop: "1rem"
        }}
      >
        <div>
          <NowPlaying nowPlaying={nowPlaying} isRenderingItem={isPlaying && !nowPlaying} />
          <Transcript lines={transcript} />
        </div>
        <QueueSidebar queue={queue} />
      </div>
      <footer style={{ marginTop: "4rem", textAlign: "center", fontSize: "0.8rem", color: "#555" }}>
        <p>Made with ♥ by <a href="https://patrickdeniso.com/">Patrick</a></p>
      </footer>
    </div>
  );
};

export default App;
