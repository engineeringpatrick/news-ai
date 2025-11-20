import { ListRestart, Pause, Play, SkipForward } from "lucide-react";
import type { FormEvent } from "react";
import React, { useState } from "react";
import { Button } from "./ui/button";

interface ControlsProps {
  onStart: () => void;
  onCommand: (command: string) => void;
  isPlaying: boolean;
  pause: () => void;
  resume: () => void;
  skipLine: () => void;
  skipStory: () => void;
}

const Controls: React.FC<ControlsProps> = ({ onStart, onCommand, isPlaying, pause, resume, skipLine, skipStory }) => {
  const [input, setInput] = useState("");

  const handleStartClick = () => {
    if (input.trim()) {
      onCommand(input.trim());
    }
    onStart();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onCommand(input.trim());
    setInput("");
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
      <button
        type="button"
        onClick={handleStartClick}
        style={{
          padding: "0.5rem 0.75rem",
          borderRadius: 6,
          border: "1px solid #4b5563",
          background: isPlaying ? "#22c55e20" : "#22c55e40",
          cursor: "pointer"
        }}
      >
        {isPlaying ? "Send update" : "Start"}
      </button>
      <form onSubmit={handleSubmit} style={{ flex: 1 }}>
        <input
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            borderRadius: 6,
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb"
          }}
          placeholder="What are you curious about today?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </form>
      { isPlaying && <Button onClick={pause} variant="outline" size="icon" aria-label="Pause"><Pause/></Button> }
      { !isPlaying && <Button onClick={resume} variant="outline" size="icon" aria-label="Resume"><Play/></Button> }
      <Button onClick={skipLine} variant="outline" size="icon" aria-label="Skip Line"><SkipForward/></Button>
      <Button onClick={skipStory} variant="outline" size="icon" aria-label="Skip Story"><ListRestart/></Button>
    </div>
  );
};

export default Controls;
