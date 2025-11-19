import type { FormEvent } from "react";
import React, { useState } from "react";

interface ControlsProps {
  onStart: () => void;
  onCommand: (command: string) => void;
  isPlaying: boolean;
}

const Controls: React.FC<ControlsProps> = ({ onStart, onCommand, isPlaying }) => {
  const [input, setInput] = useState("");

  const handleStartClick = () => {
    if (!isPlaying && input.trim()) {
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
        {isPlaying ? "Running…" : "Start"}
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
          placeholder="Type a request: “soccer news”, “less snark”, “more numbers”…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </form>
    </div>
  );
};

export default Controls;
