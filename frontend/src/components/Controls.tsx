import {ListRestart, Pause, Play, SkipForward} from 'lucide-react';
import type React from 'react';
import type {FormEvent} from 'react';
import {useState} from 'react';
import {Button} from './ui/button';

interface ControlsProps {
	onStart: () => void;
	onCommand: (command: string) => void;
	isPlaying: boolean;
	pause: () => void;
	resume: () => void;
	skipLine: () => void;
	skipStory: () => void;
}

const Controls: React.FC<ControlsProps> = ({
	onStart,
	onCommand,
	isPlaying,
	pause,
	resume,
	skipLine,
	skipStory,
}) => {
	const [input, setInput] = useState('');

	const handleStartClick = () => {
		onCommand(input.trim());
		onStart();
		setInput('');
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;
		onCommand(input.trim());
		setInput('');
		if (!isPlaying) {
			onStart();
		}
	};

	return (
		<div className='flex gap-2 mb-4'>
			<Button
				className={
					isPlaying
						? 'bg-green-500/20 border border-gray-600 px-3 py-2 rounded-md hover:bg-green-500/40'
						: 'bg-green-500/40 border border-gray-600 px-3 py-2 rounded-md hover:bg-green-500/20'
				}
				onClick={handleStartClick}
				type='button'
				variant='ghost'
			>
				{isPlaying ? 'Send' : 'Start'}
			</Button>
			<form className='flex-1' onSubmit={handleSubmit}>
				<input
					className='w-full px-3 py-2 rounded-md border border-gray-600 bg-[#020617] text-gray-200'
					onChange={e => setInput(e.target.value)}
					placeholder='What are you curious about today?'
					value={input}
				/>
			</form>
			{isPlaying && (
				<Button
					aria-label='Pause'
					onClick={pause}
					size='icon'
					variant='outline'
				>
					<Pause />
				</Button>
			)}
			{!isPlaying && (
				<Button
					aria-label='Resume'
					onClick={resume}
					size='icon'
					variant='outline'
				>
					<Play />
				</Button>
			)}
			<Button
				aria-label='Skip Line'
				onClick={skipLine}
				size='icon'
				variant='outline'
			>
				<SkipForward />
			</Button>
			<Button
				aria-label='Skip Story'
				onClick={skipStory}
				size='icon'
				variant='outline'
			>
				<ListRestart />
			</Button>
		</div>
	);
};

export default Controls;
