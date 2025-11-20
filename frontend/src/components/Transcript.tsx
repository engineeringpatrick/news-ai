import type React from 'react';
import type {TranscriptLine} from '../types';

interface TranscriptProps {
	lines: TranscriptLine[];
}

const Transcript: React.FC<TranscriptProps> = ({lines}) => {
	return (
		<div
			style={{
				padding: '1rem',
				border: '1px solid #374151',
				borderRadius: 8,
				marginTop: '1rem',
				maxHeight: 260,
				overflowY: 'auto',
			}}
		>
			<h2 style={{marginTop: 0}}>Transcript</h2>
			{lines.length === 0 && (
				<p style={{fontSize: '0.9rem', opacity: 0.7}}>No lines yet.</p>
			)}
			{lines.map((line, idx) => (
				<div key={idx} style={{marginTop: '0.5rem', fontSize: '0.9rem'}}>
					<strong>{line.speaker === 'A' ? 'Host A' : 'Host B'}:</strong>{' '}
					<span>{line.text}</span>{' '}
					{line.sources && line.sources.length > 0 && (
						<a
							href={line.sources[0]}
							rel='noreferrer'
							style={{fontSize: '0.75rem', marginLeft: '0.25rem'}}
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
