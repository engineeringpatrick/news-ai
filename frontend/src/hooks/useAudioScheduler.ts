import { useEffect, useRef, useState } from "react";
import { apiAppendTranscript, apiRenderItem } from "../api";
import type { DialogueLine, NewsStory, PersonaConfig, RenderedItem } from "../types";

interface UseAudioSchedulerParams {
  queue: NewsStory[];
  setQueue: React.Dispatch<React.SetStateAction<NewsStory[]>>;
  personaConfig: PersonaConfig;
  newsTopic: string;
}

interface UseAudioSchedulerReturn {
  nowPlaying: RenderedItem | null;
  start: () => void;
  stop: () => void;
  isPlaying: boolean;
}

export function base64ToAudioUrl(base64: string, mime: string) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: mime });
  return URL.createObjectURL(blob);
}


export function useAudioScheduler({
  queue,
  setQueue,
  personaConfig,
  newsTopic
}: UseAudioSchedulerParams): UseAudioSchedulerReturn {
  const [itemNowPlaying, setItemNowPlaying] = useState<RenderedItem | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isLoopScheduledRef = useRef(false);

  const start = () => setIsPlaying(true);
  const stop = () => setIsPlaying(false);

  // // queue refill
  // useEffect(() => {
  //   if (!isPlaying) return;
  //   if (queue.length >= 1) return;

  //   let cancelled = false;
  //   (async () => {
  //     const res = await apiNextItem(newsTopic);
  //     if (cancelled || !res || !res.story) return;
  //     setQueue((q) => [...q, res.story as NewsStory]);
  //   })();

  //   return () => {
  //     cancelled = true;
  //   };
  // }, [isPlaying, queue.length, personaConfig, setQueue]);

  // Main loop
  useEffect(() => {
    if (!isPlaying) return;
    if (isLoopScheduledRef.current) return;
    isLoopScheduledRef.current = true;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    const playLoop = async () => {
      isLoopScheduledRef.current = false; 
      if (!isPlaying) return;

      // If nothing currently rendered, render next story
      if (!itemNowPlaying) {
        console.log("item not playing, rendering next story from queue");
        if (!queue.length) {
          // TODO: play bumper audio here instead of silent wait
          setTimeout(() => {
            if (!isLoopScheduledRef.current) {
              isLoopScheduledRef.current = true;
              void playLoop();
            }
          }, 500);
          return;
        }
        
        const story = queue[0] as NewsStory;
        const rendered = await apiRenderItem(story, personaConfig);
        console.log("Rendered item from backend", rendered);
        if (!rendered || !rendered.lines.length) {
          // skip this story
          setQueue((q) => q.slice(1));
          setTimeout(() => {
            if (!isLoopScheduledRef.current) {
              isLoopScheduledRef.current = true;
              void playLoop();
            }
          }, 100);
          return;
        }

        setItemNowPlaying(rendered);
        setCurrentLineIndex(0);
        // re-enter loop with new state
        setTimeout(() => {
          if (!isLoopScheduledRef.current) {
            isLoopScheduledRef.current = true;
            void playLoop();
          }
        }, 0);
        return;
      }

      // We have a rendered item with some lines
      const { story, lines } = itemNowPlaying;
      if (currentLineIndex >= lines.length) {
        console.log("finished playing story, because ", currentLineIndex, ">=", lines.length);
        // finished story
        setQueue((q) => q.slice(1));
        setItemNowPlaying(null);
        setCurrentLineIndex(0);
        setTimeout(() => {
          if (!isLoopScheduledRef.current) {
            isLoopScheduledRef.current = true;
            void playLoop();
          }
        }, 500);
        return;
      }

      const line: DialogueLine = lines[currentLineIndex] as DialogueLine;
      const src = line.audioBase64
        ? base64ToAudioUrl(line.audioBase64 as string, line.mime || "audio/wav")
        : null;

      const handleLinePlayed = async () => {
        // estimate timing (very rough)
        const durationMs = audio.duration ? audio.duration * 1000 : 2000;
        const endMs = performance.now();
        const startMs = endMs - durationMs;

        await apiAppendTranscript(
          {
            speaker: line.speaker,
            text: line.text,
            sources: line.sources,
            audioBase64: line.audioBase64 as string,
            mime: line.mime || null
          },
          startMs,
          endMs
        );

        setCurrentLineIndex((i) => i + 1);
        setTimeout(() => {
          if (!isLoopScheduledRef.current) {
            isLoopScheduledRef.current = true;
            void playLoop();
          }
        }, 500);
      };

      // If we don't have audio, fake duration
      if (!src) {
        setTimeout(() => {
          void handleLinePlayed();
        }, 2000);
        return;
      }

      audio.src = src;
      audio.onended = () => {
        void handleLinePlayed();
      };
      audio.onerror = () => {
        // skip this line
        setCurrentLineIndex((i) => i + 1);
        setTimeout(() => {
          if (!isLoopScheduledRef.current) {
            isLoopScheduledRef.current = true;
            void playLoop();
          }
        }, 100);
      };

      try {
        await audio.play();
      } catch (err) {
        console.error("audio play error (probably autoplay blocked)", err);
        // user must click Start manually
      }
    };

    // kick once
    void playLoop();

    return () => {
      // nothing to clean; we only gate via isPlaying + refs
    };
  }, [isPlaying, itemNowPlaying, currentLineIndex, queue, personaConfig, setQueue]);

  return { nowPlaying: itemNowPlaying, start, stop, isPlaying: isPlaying };
}
