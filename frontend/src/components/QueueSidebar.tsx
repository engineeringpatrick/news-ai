import React from "react";
import type { NewsStory } from "../types";

interface QueueSidebarProps {
  queue: NewsStory[];
}

const QueueSidebar: React.FC<QueueSidebarProps> = ({ queue }) => {
  return (
    <div
      style={{
        padding: "1rem",
        border: "1px solid #374151",
        borderRadius: 8,
        height: "100%",
        maxHeight: "480px",
        overflowY: "auto"
      }}
    >
      <h2 style={{ marginTop: 0 }}>Up Next</h2>
      {queue.length === 0 && <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>Queue is currently empty.</p>}
      {queue.map((story, index) => (
        <div
          key={story.id}
          style={{
            marginTop: "0.75rem",
            paddingTop: index === 0 ? 0 : "0.75rem",
            borderTop: index === 0 ? "none" : "1px solid #1f2933"
          }}
        >
          <div style={{ fontSize: "0.7rem", opacity: 0.7 }}>#{index + 1}</div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {story.image && (
              <img
                src={story.image}
                alt={story.headline}
                style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4 }}
              />
            )}
            <div>
              <div style={{ fontSize: "0.9rem" }}>{story.headline}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>{story.publisher}</div>
              <a
                href={story.url}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "0.75rem", display: "inline-block", marginTop: "0.1rem" }}
              >
                [src]
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QueueSidebar;
