import React from "react";
import type { RenderedItem } from "../types";

interface NowPlayingProps {
  nowPlaying: RenderedItem | null;
  isRenderingItem?: boolean;
}

const NowPlaying: React.FC<NowPlayingProps> = ({ nowPlaying, isRenderingItem }) => {
  if(isRenderingItem) {
    return (
      <div
        style={{
          padding: "1rem",
          border: "1px solid #374151",
          borderRadius: 8,
          minHeight: 160
        }}
      >
        <h2 style={{ marginTop: 0 }}>Loading next news item...</h2>
        <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>This may take a few seconds...</p>
        <img
        src="/tv-static.gif"
        alt="TV static gif..."
        style={{
          maxWidth: "100%",
          borderRadius: 8,
          marginBottom: "0.75rem"
        }}
      />
      </div>
    );
  }

  if (!nowPlaying || !nowPlaying.story) {
    return (
      <div
        style={{
          padding: "1rem",
          border: "1px solid #374151",
          borderRadius: 8,
          minHeight: 160
        }}
      >
        <h2 style={{ marginTop: 0 }}>Now Playing</h2>
        <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>Nothing yet. Click Start to begin the newscast.</p>
      </div>
    );
  }

  const { story } = nowPlaying;

  return (
    <div
      style={{
        padding: "1rem",
        border: "1px solid #374151",
        borderRadius: 8
      }}
    >
      
      <h2 style={{ marginTop: 0 }}>Now Playing</h2>
      <img
        src={story.image ? story.image : "/placeholder.webp"}
        alt={story.headline}
        style={{
          maxWidth: "50%",
          borderRadius: 8,
          marginBottom: "0.75rem"
        }}
      />
      <h3 style={{ margin: "0 0 0.25rem 0" }}>{story.headline}</h3>
      <p style={{ fontSize: "0.8rem", opacity: 0.75, margin: 0 }}>{story.publisher || ""}</p>
      <a
        href={story.url}
        target="_blank"
        rel="noreferrer"
        style={{ fontSize: "0.8rem", marginTop: "0.25rem", display: "inline-block" }}
      >
        [Source]
      </a>
    </div>
  );
};

export default NowPlaying;
