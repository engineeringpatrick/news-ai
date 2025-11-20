// AudioPlayer.tsx
import {useEffect, useState} from 'react';
import {useTTSWebSocket} from '@/hooks/useTTSWebSocket';
import type {NewsStory, PersonaConfig} from '@/types';
import Controls from './Controls';
import VolumeSlider from './VolumeControl';

interface AudioPlayerProps {
	handleCommand: (command: string) => void;
	stories: NewsStory[];
	setStories: React.Dispatch<React.SetStateAction<NewsStory[]>>;
	personaConfig: PersonaConfig;
}

export function AudioPlayer({
	handleCommand,
	stories,
	setStories,
	personaConfig,
}: AudioPlayerProps) {
	const {
		connected,
		transcript,
		volume,
		setVolume,
		sendPayload,
		isStoryPlaying,
		setIsStoryPlaying,
		pause,
		resume,
		stop,
		clearTranscript,
	} = useTTSWebSocket();

	const [currentStory, setCurrentStory] = useState<NewsStory>();

	const playNextStory = () => {
		stop();
		clearTranscript();
		if (!stories) return;

		setIsStoryPlaying(true);
		const toSend = stories[0] as NewsStory;
		setCurrentStory(toSend);

		sendPayload({
			newsStory: toSend,
			personaConfig,
			browserSampleRate: new AudioContext().sampleRate,
		});

		setStories(stories.slice(0));
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: playNextStory cannot be a dependency
	useEffect(() => {
		if (isStoryPlaying) return;

		playNextStory();
	}, [isStoryPlaying, stories]);

	const handleInput = (userInput: string) => {
		handleCommand(userInput);
	};

	return (
		<div className='flex flex-col gap-4 p-4'>
			<div>ws: {connected ? 'connected' : 'connecting'}</div>

			<section className='mb-4'>
				<Controls
					pause={pause}
					resume={resume}
					skip={playNextStory}
					start={handleInput}
				/>
				<div className='mt-3'>
					<VolumeSlider setVolume={setVolume} volume={volume} />
				</div>
			</section>

			<div className='text-sm text-gray-400'>
				story: <p>{currentStory?.headline}</p>
			</div>

			<div className='bg-black/40 p-3 rounded-md h-48 w-128 overflow-y-scroll text-sm space-y-1'>
				{transcript.map((t, i) => (
					<p key={i}>{t}</p>
				))}
			</div>
		</div>
	);
}
