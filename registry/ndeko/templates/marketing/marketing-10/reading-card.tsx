import { BentoCard } from './bento-card';
import { READING } from './data';

export function ReadingCard({ className }: { className?: string }) {
  return (
    <BentoCard title='Reading now' className={className}>
      <ul className='flex flex-col gap-4'>
        {READING.map((item) => {
          const fillStyle = { width: `${item.progress}%` };

          return (
            <li key={item.title} className='flex flex-col gap-2'>
              <div className='flex flex-col'>
                <p className='text-[13px] font-medium text-balance'>
                  {item.title}
                </p>
                <p className='text-muted-foreground text-xs'>{item.author}</p>
              </div>
              <div className='flex items-center gap-3'>
                <div
                  role='img'
                  aria-label={`${item.progress} per cent read`}
                  className='bg-foreground/[0.08] h-1 flex-1 overflow-hidden rounded-full'
                >
                  <div
                    style={fillStyle}
                    className='bg-primary h-full rounded-full'
                  />
                </div>
                <span className='text-muted-foreground text-xs tabular-nums'>
                  {item.progress}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </BentoCard>
  );
}
