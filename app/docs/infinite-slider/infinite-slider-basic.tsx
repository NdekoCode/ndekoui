import { InfiniteSlider } from '@/components/core/infinite-slider';
import { cn } from '@/registry/ndeko/lib/utils';

const WORDMARKS = [
  { name: 'Halden', marks: ['size-5 rounded-full bg-current'] },
  { name: 'Quillstone', marks: ['size-5 rounded-[4px] bg-current'] },
  {
    name: 'Tidewell',
    marks: [
      'h-5 w-1 rounded-full bg-current',
      'h-5 w-1 rounded-full bg-current',
    ],
  },
  {
    name: 'Ashgrove',
    marks: ['size-5 rounded-full hairline-ring ring-current'],
  },
  { name: 'Brightmoor', marks: ['size-4 rotate-45 rounded-[3px] bg-current'] },
  { name: 'Fernhill', marks: ['h-5 w-3 rounded-full bg-current'] },
];

export function InfiniteSliderBasic() {
  return (
    <InfiniteSlider gap={24} reverse>
      {WORDMARKS.map((wordmark) => (
        <div
          key={wordmark.name}
          className='text-muted-foreground flex h-[120px] items-center gap-2.5 px-4'
        >
          <span aria-hidden='true' className='flex items-center gap-1'>
            {wordmark.marks.map((mark, index) => (
              <span key={`${wordmark.name}-${index}`} className={cn(mark)} />
            ))}
          </span>
          <span className='text-2xl font-semibold'>{wordmark.name}</span>
        </div>
      ))}
    </InfiniteSlider>
  );
}
