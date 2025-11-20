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
		if (input.trim()) {
			onCommand(input.trim());
		}
		onStart();
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
		<div style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem'}}>
			<button
				onClick={handleStartClick}
				style={{
					padding: '0.5rem 0.75rem',
					borderRadius: 6,
					border: '1px solid #4b5563',
					background: isPlaying ? '#22c55e20' : '#22c55e40',
					cursor: 'pointer',
				}}
				type='button'
			>
				{isPlaying ? 'Send' : 'Start'}
			</button>
			<form onSubmit={handleSubmit} style={{flex: 1}}>
				<input
					onChange={e => setInput(e.target.value)}
					placeholder='What are you curious about today?'
					style={{
						width: '100%',
						padding: '0.5rem 0.75rem',
						borderRadius: 6,
						border: '1px solid #4b5563',
						background: '#020617',
						color: '#e5e7eb',
					}}
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
