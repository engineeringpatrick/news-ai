import type React from 'react';
import type {NewsStory} from '../types';

interface QueueSidebarProps {
	queue: NewsStory[];
}

const QueueSidebar: React.FC<QueueSidebarProps> = ({queue}) => {
	return (
		<div className='p-4 border bg-slate-900/40 rounded-lg min-h-[300px] max-h-[480px] overflow-y-auto'>
			<h2 className='mt-0'>Up Next</h2>
			{queue.length === 0 && (
				<p className='text-[0.9rem] opacity-70'>Queue is currently empty.</p>
			)}

			{queue.map((story, index) => {
				const itemBase = 'mt-3';
				const itemExtra =
					index === 0 ? 'pt-0 border-t-0' : 'pt-3 border-t border-t-gray-800';
				return (
					<div className={`${itemBase} ${itemExtra}`} key={story.id}>
						<div className='text-[0.7rem] opacity-70'>#{index + 1}</div>
						<div className='flex gap-2'>
							{story.image && (
								<img
									alt={story.headline}
									className='object-cover rounded-sm'
									height={64}
									src={story.image}
									width={64}
								/>
							)}
							<div>
								<div className='text-[0.9rem]'>{story.headline}</div>
								<div className='text-[0.75rem] opacity-70'>
									{story.publisher}
								</div>
								<a
									className='text-[0.75rem] inline-block mt-0.5'
									href={story.url}
									rel='noreferrer'
									target='_blank'
								>
									[src]
								</a>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default QueueSidebar;
