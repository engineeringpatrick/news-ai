import type React from 'react';
import type {RenderedItem} from '../types';

interface NowPlayingProps {
	nowPlaying: RenderedItem | null;
	isRenderingItem?: boolean;
}

const NowPlaying: React.FC<NowPlayingProps> = ({
	nowPlaying,
	isRenderingItem,
}) => {
	if (isRenderingItem) {
		return (
			<div className='p-4 border border-gray-700 rounded-lg min-h-[160px]'>
				<h2 className='mt-0'>Loading next news item...</h2>
				<p className='text-[0.9rem] opacity-70'>
					This may take a few seconds...
				</p>
				<img
					alt='TV static gif...'
					className='max-w-full rounded-lg mb-3'
					height={120}
					src='/tv-static.gif'
					width={120}
				/>
			</div>
		);
	}

	if (!nowPlaying?.story) {
		return (
			<div className='p-4 border border-gray-700 rounded-lg min-h-[160px]'>
				<h2 className='mt-0'>Now Playing</h2>
				<p className='text-[0.9rem] opacity-70'>
					Nothing yet. Click Start to begin the newscast.
				</p>
			</div>
		);
	}

	const {story} = nowPlaying;

	return (
		<div className='p-4 border border-gray-700 rounded-lg'>
			<h2 className='mt-0'>Now Playing</h2>
			<img
				alt={story.headline}
				className='max-w-[50%] rounded-lg mb-3'
				height={150}
				src={story.image ? story.image : '/placeholder.webp'}
				width={150}
			/>
			<h3 className='mb-1'>{story.headline}</h3>
			<p className='text-[0.8rem] opacity-75 m-0'>{story.publisher || ''}</p>
			<a
				className='text-[0.8rem] mt-1 inline-block'
				href={story.url}
				rel='noreferrer'
				target='_blank'
			>
				[Source]
			</a>
		</div>
	);
};

export default NowPlaying;
