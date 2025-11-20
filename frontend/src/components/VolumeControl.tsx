'use client';

import {Volume2Icon} from 'lucide-react';
import {Label} from '@/components/ui/label';
import {Slider} from '@/components/ui/slider';

export const title = 'Volume Control';

interface VolumeSliderParams {
	volume: number;
	setVolume: React.Dispatch<React.SetStateAction<number>>;
}

const VolumeSlider = ({volume, setVolume}: VolumeSliderParams) => {
	return (
		<div className='flex w-full max-w-md flex-col gap-2'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<Volume2Icon className='size-4' />
					<Label htmlFor='slider'>Volume</Label>
				</div>
				<span className='text-muted-foreground text-sm'>
					{Math.round(volume * 100)}%
				</span>
			</div>
			<Slider
				id='slider'
				onValueChange={(volArr: number[]) =>
					setVolume((volArr[0] as number) / 100)
				}
				value={[volume * 100]}
			/>
		</div>
	);
};

export default VolumeSlider;
