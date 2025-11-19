import { useEffect, useRef, useState } from "react";
import {
  apiAppendTranscript,
  apiNextItems,
  apiRenderItem,
} from "../api";
import type {
  DialogueLine,
  NewsStory,
  PersonaConfig,
  RenderedItem,
  TranscriptLine,
} from "../types";

interface UseAudioSchedulerParams {
  // Queue A: raw stories (owned by parent)
  queue: NewsStory[];
  setQueue: React.Dispatch<React.SetStateAction<NewsStory[]>>;

  // Transcript display in UI
  setTranscript: React.Dispatch<React.SetStateAction<TranscriptLine[]>>;

  // Global play/pause
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;

  personaConfig: PersonaConfig;
  newsTopic: string;
}

interface UseAudioSchedulerReturn {
  nowPlaying: RenderedItem | null;
  start: () => void;
  stop: () => void;
  skipLine: () => void;
  skipStory: () => void;
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

// Internal: rendered item tagged with persona version at render time
type RenderedItemWithPersona = RenderedItem & { personaVersion: number };

export function useAudioScheduler({
  queue,
  setQueue,
  setTranscript,
  isPlaying,
  setIsPlaying,
  personaConfig,
  newsTopic,
}: UseAudioSchedulerParams): UseAudioSchedulerReturn {
  // Queue B: rendered stories (with audio)
  const [renderedQueue, setRenderedQueue] = useState<RenderedItemWithPersona[]>([]);
  const [nowPlaying, setNowPlaying] = useState<RenderedItemWithPersona | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  // Single audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Persona version increments on config change
  const personaVersionRef = useRef(0);

  // Current story being played (for re-queue on persona switch)
  const currentStoryRef = useRef<NewsStory | null>(null);

  // Flags for async work
  const isFetchingStoriesRef = useRef(false);
  const isRenderingRef = useRef(false);

  const start = () => setIsPlaying(true);
  const stop = () => setIsPlaying(false);

  // Ensure one audio element
  if (!audioRef.current && typeof Audio !== "undefined") {
    audioRef.current = new Audio();
  }
  const audio = audioRef.current;

  // 1) Auto-refill raw story queue (Queue A) when low
  useEffect(() => {
    if (!isPlaying) return;

    const MIN_STORIES = 10;
    if (queue.length >= MIN_STORIES) return;
    if (isFetchingStoriesRef.current) return;

    isFetchingStoriesRef.current = true;

    (async () => {
      try {
        const res = await apiNextItems(newsTopic);
        if (res?.newStories?.length) {
          setQueue((q) => [...q, ...res.newStories!]);
        }
      } finally {
        isFetchingStoriesRef.current = false;
      }
    })();
  }, [isPlaying, queue.length, newsTopic, setQueue]);

  // 2) Persona change:
  //    - bump persona version
  //    - flush renderedQueue
  //    - keep queue A
  //    - do NOT kill current line; we handle switch after the line finishes
  useEffect(() => {
    personaVersionRef.current += 1;
    setRenderedQueue([]);
    // currentStoryRef and nowPlaying are left as-is for the current line.
  }, [personaConfig]);

  // 3) Pre-render next stories from Queue A into Queue B while playing
  useEffect(() => {
    if (!isPlaying) return;
    if (!queue.length) return;
    if (isRenderingRef.current) return;

    const MAX_RENDERED_AHEAD = 5;
    // we keep invariant: renderedQueue[i] corresponds to queue[i]
    if (renderedQueue.length >= Math.min(queue.length, MAX_RENDERED_AHEAD)) return;

    const storyIndex = renderedQueue.length;
    const story = queue[storyIndex];
    if (!story) return;

    isRenderingRef.current = true;

    const personaVersionAtRenderStart = personaVersionRef.current;
    let cancelled = false;

    (async () => {
      try {
        const rendered = await apiRenderItem(story, personaConfig);
        if (cancelled) return;

        if (!rendered || !rendered.lines || !rendered.lines.length) {
          // Skip bad story
          setQueue((q) => q.filter((_, idx) => idx !== storyIndex));
          return;
        }

        // If persona changed during render, drop this result
        if (personaVersionRef.current !== personaVersionAtRenderStart) return;

        const tagged: RenderedItemWithPersona = {
          ...rendered,
          personaVersion: personaVersionAtRenderStart,
        };

        setRenderedQueue((prev) => [...prev, tagged]);
      } finally {
        isRenderingRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isPlaying, queue, renderedQueue.length, personaConfig, nowPlaying, setQueue]);

  // 4) When playing and there is no nowPlaying but we have rendered items, start next story
  useEffect(() => {
    if (!isPlaying) return;
    if (nowPlaying) return;
    if (!renderedQueue.length) return;

    const [next, ...rest] = renderedQueue;

    // Remove corresponding story from Queue A prefix
    setQueue((q) => q.slice(1));

    setRenderedQueue(rest);
    setNowPlaying(next as RenderedItemWithPersona);
    setCurrentLineIndex(0);
    currentStoryRef.current = next!.story as NewsStory;
  }, [isPlaying, nowPlaying, renderedQueue, setQueue]);

  // 5) Play current line of nowPlaying
  useEffect(() => {
    if (!isPlaying) return;
    if (!audio) return;
    if (!nowPlaying) return;

    const lines = nowPlaying.lines as DialogueLine[];
    const line = lines[currentLineIndex];

    if (!line) {
      // No more lines in this story
      currentStoryRef.current = null;
      setNowPlaying(null);
      setCurrentLineIndex(0);
      setTranscript([]);
      return;
    }

    // Update transcript with this line
    setTranscript([line as TranscriptLine]);

    const src = line.audioBase64
      ? base64ToAudioUrl(line.audioBase64 as string, line.mime || "audio/wav")
      : null;

    let ended = false;

    const handleFinished = async () => {
      if (ended) return;
      ended = true;

      // Rough timing estimate for append
      const durationMs = audio.duration ? audio.duration * 1000 : 2000;
      const endMs = performance.now();
      const startMs = endMs - durationMs;

      await apiAppendTranscript(
        {
          speaker: line.speaker,
          text: line.text,
          sources: line.sources,
        },
        startMs,
        endMs
      );

      const personaVersionAtRender = nowPlaying.personaVersion;
      const personaChanged = personaVersionAtRender !== personaVersionRef.current;

      // If persona changed mid-story: finish this line, then
      // - drop current rendered story
      // - requeue its raw story at front
      // - clear nowPlaying so a new version with new persona is rendered
      if (personaChanged) {
        const currentStory = currentStoryRef.current;
        if (currentStory) {
          setQueue((q) => [currentStory, ...q]);
        }
        setNowPlaying(null);
        setCurrentLineIndex(0);
        setTranscript([]);
        return;
      }

      // Normal case: move to next line or finish story
      const linesNow = (nowPlaying.lines as DialogueLine[]) ?? [];
      if (currentLineIndex + 1 < linesNow.length) {
        setCurrentLineIndex((i) => i + 1);
      } else {
        currentStoryRef.current = null;
        setNowPlaying(null);
        setCurrentLineIndex(0);
        setTranscript([]);
      }
    };

    if (!src) {
      // No audio available, simulate duration
      const timeoutId = window.setTimeout(() => {
        void handleFinished();
      }, 2000);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    audio.src = src;

    audio.onended = () => {
      void handleFinished();
    };

    audio.onerror = () => {
      if (ended) return;
      ended = true;

      // Skip this line on error
      const linesNow = (nowPlaying.lines as DialogueLine[]) ?? [];
      if (currentLineIndex + 1 < linesNow.length) {
        setCurrentLineIndex((i) => i + 1);
      } else {
        currentStoryRef.current = null;
        setNowPlaying(null);
        setCurrentLineIndex(0);
        setTranscript([]);
      }
    };

    (async () => {
      try {
        await audio.play();
      } catch (err) {
        console.error("audio play error (probably autoplay blocked)", err);
      }
    })();

    // Cleanup for this line
    return () => {
      audio.onended = null;
      audio.onerror = null;
    };
  }, [
    isPlaying,
    nowPlaying,
    currentLineIndex,
    audio,
    setQueue,
    setTranscript,
  ]);

  // 6) Pause audio when stopped
  useEffect(() => {
    if (!audio) return;
    if (!isPlaying) {
      audio.pause();
    }
  }, [isPlaying, audio]);

  // 7) Static sound while rendering (unchanged behavior)
  useEffect(() => {
    if (nowPlaying || !isPlaying) return;
    const staticAudio = new Audio("/tv-static.mp3");

    staticAudio.loop = true;
    staticAudio.volume = 0.3;

    staticAudio.play().catch(() => {
      console.log("autoplay blocked for static audio");
    });

    return () => {
      staticAudio.pause();
      staticAudio.currentTime = 0;
    };
  }, [isPlaying, nowPlaying]);

  const skipLine = () => {
    setCurrentLineIndex((i) => i + 1);
    audio?.pause();
    audio?.dispatchEvent(new Event('ended'))
  };

  const skipStory = () => {
    currentStoryRef.current = null;
    setNowPlaying(null);
    setCurrentLineIndex(0);
    setTranscript([]);
    audio?.pause();
    audio?.dispatchEvent(new Event('ended'));
  };

  return {
    nowPlaying,
    start,
    stop,
    skipLine,
    skipStory,
    isPlaying,
  };
}
