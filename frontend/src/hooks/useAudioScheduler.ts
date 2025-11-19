import { useEffect, useRef, useState } from "react";
import {
  apiAppendTranscript, apiNextItems, apiRenderItem, /*, apiNextItem */
} from "../api";
import type {
  DialogueLine,
  NewsStory,
  PersonaConfig,
  RenderedItem,
  TranscriptLine,
} from "../types";

interface UseAudioSchedulerParams {
  queue: NewsStory[];
  setQueue: React.Dispatch<React.SetStateAction<NewsStory[]>>;
  setTranscript: React.Dispatch<React.SetStateAction<TranscriptLine[]>>;
  isRenderingItem: boolean;
  setIsRenderingItem: React.Dispatch<React.SetStateAction<boolean>>;
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

export function useAudioScheduler({
  queue, // this queue only contains NewsStory items
  setQueue,
  setTranscript,
  isRenderingItem,
  setIsRenderingItem,
  isPlaying,
  setIsPlaying,
  personaConfig,
  newsTopic,
}: UseAudioSchedulerParams): UseAudioSchedulerReturn {
  const [nowPlaying, setNowPlaying] = useState<RenderedItem | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [renderedItemsQueue, setRenderedItemsQueue] = useState<RenderedItem[]>([]); // this queue contains fully rendered items (with dialogue lines and audio)
  const [storyToRenderIdx, setStoryToRenderIdx] = useState(0);
  const [wasPersonaUpdated, setWasPersonaUpdated] = useState(false);
  const initialRender = useRef(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadingItemRef = useRef(false);

  const start = () => setIsPlaying(true);
  const stop = () => setIsPlaying(false);

  // Ensure we have a single audio element
  if (!audioRef.current && typeof Audio !== "undefined") {
    audioRef.current = new Audio();
  }

  const audio = audioRef.current;

  // 1) auto-refill queue when empty
  useEffect(() => {
    if (!isPlaying) return;
    if (queue.length >= 10) return;
    
    (async () => {
      const res = await apiNextItems(newsTopic);
      if (!res || !res.newStories) return;

      setQueue((q) => [...q, ...res.newStories]);
    })();
  }, [isPlaying, queue.length, newsTopic]);

  useEffect(() => {
    // Reset when personaConfig changes
    if (initialRender.current) { initialRender.current = false; return; }
    setRenderedItemsQueue([]);
    setStoryToRenderIdx(0);
    setWasPersonaUpdated(true);
  }, [personaConfig]);

  useEffect(() => {
    console.log("running renderedItemsQueue effect; length =", renderedItemsQueue.length);
    if (queue.length === 0) return;
    if (storyToRenderIdx >= queue.length) return;
    if (renderedItemsQueue.length > 5) return;
    if (loadingItemRef.current) return;

    loadingItemRef.current = true;
    if (!nowPlaying) { setIsRenderingItem(true); }
    
    (async () => {
      console.log("calling apiRenderItem for story", queue[0]);
      const res = await apiRenderItem(queue[storyToRenderIdx] as NewsStory, personaConfig);
      if(wasPersonaUpdated) { setWasPersonaUpdated(false); return;}
      if(!res) { console.log("apiRenderItem returned null"); return; };
      
      setStoryToRenderIdx((i) => i + 1);
      setRenderedItemsQueue((q) => [...q, res as RenderedItem]);
    })();
    
    loadingItemRef.current = false;
  }, [renderedItemsQueue.length, queue.length]);

  // 2) When playing and we have no rendered item but we have a story, render it
  useEffect(() => {
    if (!isPlaying) return;
    if (nowPlaying) return;
    if (!renderedItemsQueue.length) return;

    setNowPlaying(renderedItemsQueue.shift() as RenderedItem);
    setQueue((q) => q.slice(1));
    setStoryToRenderIdx((i) => i - 1);
    setIsRenderingItem(false);
  }, [isPlaying, nowPlaying, renderedItemsQueue.length]);

  // 3) When nowPlaying or currentLineIndex changes while playing, play that line
  useEffect(() => {
    if (!isPlaying) return;
    if (!audio) return;
    if (!nowPlaying) return;

    const lines = nowPlaying.lines as DialogueLine[];
    const line = lines[currentLineIndex];
    setTranscript([line as TranscriptLine]);

    if (!line) {
      // No more lines -> finish story
      setQueue((q) => q.slice(1));
      setNowPlaying(null);
      setCurrentLineIndex(0);
      setTranscript([]);
      setIsRenderingItem(true);
      return;
    }

    const src = line.audioBase64
      ? base64ToAudioUrl(line.audioBase64 as string, line.mime || "audio/wav")
      : null;

    let ended = false;

    const handleFinished = async () => {
      if (ended) return;
      ended = true;

      // Estimate timing (rough)
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

      // Move to next line or next story
      const linesNow = (nowPlaying.lines as DialogueLine[]) ?? [];
      if (currentLineIndex + 1 < linesNow.length) {
        setCurrentLineIndex((i) => i + 1);
      } else {
        setQueue((q) => q.slice(1));
        setNowPlaying(null);
        setCurrentLineIndex(0);
        setTranscript([]);
        setIsRenderingItem(true);
      }
    };

    if (!src) {
      // No audio, simulate duration
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
      // Skip this line on error
      if (!ended) {
        ended = true;
        if (currentLineIndex + 1 < (nowPlaying.lines as DialogueLine[]).length) {
          setCurrentLineIndex((i) => i + 1);
        } else {
          setQueue((q) => q.slice(1));
          setNowPlaying(null);
          setCurrentLineIndex(0);
        }
      }
    };

    // Start playback
    (async () => {
      try {
        await audio.play();
      } catch (err) {
        console.error("audio play error (probably autoplay blocked)", err);
      }
    })();

    // Cleanup for this particular line
    return () => {
      audio.onended = null;
      audio.onerror = null;
      // do not pause here; next effect will set new src / handlers
    };
  }, [isPlaying, nowPlaying, currentLineIndex, setQueue]);

  // 4) Pause audio when stopped
  useEffect(() => {
    if (!audio) return;
    if (!isPlaying) {
      audio.pause();
    }
  }, [isPlaying, audio]);

  useEffect(() => {
    if (!isRenderingItem) return;
    const audio = new Audio("/tv-static.mp3");

    audio.loop = true;
    audio.volume = 0.3;

    audio.play().catch(() => {
      console.log("autoplay blocked");
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
}, [isRenderingItem]);

  return { 
    nowPlaying, 
    start, 
    stop,   
    skipLine: () => setCurrentLineIndex(i => i + 1),
    skipStory: () => {
      if(queue) setQueue(q => q.slice(1));
      setNowPlaying(null);
      setCurrentLineIndex(0);
      setTranscript([]);
      setIsRenderingItem(true);
    },
    isPlaying };
}
