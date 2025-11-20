import {Pause, Play, SkipForward} from 'lucide-react';
import type React from 'react';
import {useState} from 'react';
import {Button} from './ui/button';

interface ControlsProps {
	start: (userInput: string) => void;
	pause: () => void;
	resume: () => void;
	skip: () => void;
}

const Controls: React.FC<ControlsProps> = ({start, pause, resume, skip}) => {
	const [input, setInput] = useState('');
	const isPlaying = true; // todo: replace placeholder with actual state later
	return (
		<div className='flex gap-2 mb-4'>
			<Button
				className={
					'bg-green-500/20 border border-gray-600 px-3 py-2 rounded-md hover:bg-green-500/40'
				}
				onClick={() => start(input)}
				type='button'
				variant='ghost'
			>
				{'Start'}
			</Button>
			<form className='flex-1' onSubmit={() => start(input)}>
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
			<Button aria-label='Skip' onClick={skip} size='icon' variant='outline'>
				<SkipForward />
			</Button>
		</div>
	);
};

export default Controls;
