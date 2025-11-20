import type React from 'react';
import {useState} from 'react';
import {apiUserCommand} from './api';
import Controls from './components/Controls';
import NowPlaying from './components/NowPlaying';
import QueueSidebar from './components/QueueSidebar';
import Transcript from './components/Transcript';
import VolumeSlider from './components/VolumeControl';
import {useAudioScheduler} from './hooks/useAudioScheduler';
import {usePersistedState} from './hooks/usePersistedState';
import type {NewsStory, PersonaConfig, TranscriptLine} from './types';

const defaultPersona: PersonaConfig = {
	personaA: {
		name: 'Host A',
		style: 'factual, analytical, structured, serious.',
	},
	personaB: {
		name: 'Host B',
		style: 'bubbly, conversational, with lots of funny jokes',
	},
};

const App: React.FC = () => {
	const [personaConfig, setPersonaConfig] = usePersistedState<PersonaConfig>(
		'personaConfig',
		defaultPersona,
	);
	const [newsTopic, setNewsTopic] = usePersistedState<string>(
		'newsTopic',
		'global',
	);
	const [queue, setQueue] = useState<NewsStory[]>([]);
	const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
	const [isPlaying, setIsPlaying] = useState(false);
	const [volume, setVolume] = useState(0.5);

	const {nowPlaying, start, stop, skipLine, skipStory} = useAudioScheduler({
		queue,
		setQueue,
		setTranscript,
		isPlaying,
		setIsPlaying,
		personaConfig,
		newsTopic,
		volume,
	});

	const handleCommand = async (command: string) => {
		const data = await apiUserCommand(command, personaConfig, newsTopic);
		if (!data) return;

		const {
			personaConfig: updatedPersona,
			newsTopic: newsTopicData,
			newStories,
		} = data;

		setPersonaConfig(prev => ({
			...prev,
			...updatedPersona,
		}));
		setNewsTopic(newsTopicData);

		if (newStories && newStories.length > 0) {
			setQueue(prevQueue => {
				if (prevQueue.length === 0) {
					return [...newStories];
				}
				const [current, ...rest] = prevQueue;
				return current
					? [current, ...newStories, ...rest]
					: [...newStories, ...rest];
			});
		}
	};

	return (
		<div className='mx-auto max-w-5xl p-6 min-h-screen flex flex-col'>
			<header className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6'>
				<div>
					<h1 className='text-2xl font-semibold leading-tight'>News.AI</h1>
					<p className='text-sm text-gray-400 mt-1'>
						One-click conversational & customizable newscast
					</p>
				</div>

				<div className='flex items-center gap-3'>
					<div className='text-sm bg-slate-800/60 px-3 py-1 rounded-sm text-gray-200'>
						Topic:{' '}
						<span className='font-semibold text-white ml-1'>{newsTopic}</span>
					</div>

					<div className='hidden sm:flex gap-2'>
						<div className='text-xs text-left bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2'>
							<div className='font-medium'>{personaConfig.personaA.name}</div>
							<div className='text-[0.78rem] text-gray-300 truncate max-w-[220px]'>
								{personaConfig.personaA.style}
							</div>
						</div>
						<div className='text-xs text-left bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2'>
							<div className='font-medium'>{personaConfig.personaB.name}</div>
							<div className='text-[0.78rem] text-gray-300 truncate max-w-[220px]'>
								{personaConfig.personaB.style}
							</div>
						</div>
					</div>
				</div>
			</header>
			<section className='mb-4'>
				<Controls
					isPlaying={isPlaying}
					onCommand={handleCommand}
					onStart={start}
					pause={stop}
					resume={start}
					skipLine={skipLine}
					skipStory={skipStory}
				/>
				<div className='mt-3'>
					<VolumeSlider setVolume={setVolume} volume={volume} />
				</div>
			</section>
			<main className='flex-1 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6'>
				{/* left column */}
				<div className='space-y-4'>
					<div className='bg-slate-900/40 border border-slate-800 rounded-lg p-4'>
						<NowPlaying
							isRenderingItem={isPlaying && !nowPlaying}
							nowPlaying={nowPlaying}
						/>
					</div>

					<div className='bg-slate-900/40 border border-slate-800 rounded-lg p-4'>
						<h2 className='text-base font-medium mb-2'>Transcript</h2>
						<Transcript lines={transcript} />
					</div>
				</div>

				{/* right column */}
				<div className='flex flex-col gap-4'>
					<QueueSidebar queue={queue} />

					<div className='bg-transparent text-sm text-gray-400 p-3 rounded-md'>
						<p className='mb-1'>Quick tips</p>
						<ul className='list-disc list-inside text-[0.9rem] text-gray-400'>
							<li>Type topics like "soccer", "economy", or "climate".</li>
							<li>Control tone with "more numbers" or "less snark".</li>
							<li>Use Skip Line / Skip Story to move through the newscast.</li>
						</ul>
					</div>
				</div>
			</main>
			<footer className='text-center text-sm text-gray-500'>
				<p>
					Made with ♥ by{' '}
					<a className='text-blue-400' href='https://patrickdeniso.com/'>
						Patrick
					</a>
				</p>
			</footer>
		</div>
	);
};

export default App;
