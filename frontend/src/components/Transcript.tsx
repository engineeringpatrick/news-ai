import type React from 'react';
import type {TranscriptLine} from '../types';

interface TranscriptProps {
	lines: TranscriptLine[];
}

const Transcript: React.FC<TranscriptProps> = ({lines}) => {
	return (
		<div className='p-4 border border-gray-700 rounded-lg mt-4 max-h-[260px] overflow-y-auto'>
			<h2 className='mt-0'>Transcript</h2>
			{lines.length === 0 && (
				<p className='text-[0.9rem] opacity-70'>No lines yet.</p>
			)}
			{lines.map((line, idx) => (
				<div className='mt-2 text-[0.9rem]' key={idx}>
					<strong>{line.speaker === 'A' ? 'Host A' : 'Host B'}:</strong>{' '}
					<span>{line.text}</span>{' '}
					{line.sources && line.sources.length > 0 && (
						<a
							className='text-[0.75rem] ml-1'
							href={line.sources[0]}
							rel='noreferrer'
							target='_blank'
						>
							[src]
						</a>
					)}
				</div>
			))}
		</div>
	);
};

export default Transcript;
