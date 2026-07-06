import { MasonryGrid } from '@/components/core/masonry-grid';
import { CheckIcon, SunIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

const CARD = 'bg-foreground/[0.04] flex flex-col gap-2 rounded-xl p-4';

const PACKING = [
  { label: 'Two warm layers', done: true },
  { label: 'Ferry tickets', done: true },
  { label: 'Long lens', done: false },
  { label: 'Headlamp', done: false },
];

function PhotoCard({ src, title }: { src: string; title: string }) {
  return (
    <figure className={cn(CARD, 'p-2')}>
      {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps the example portable */}
      <img
        src={src}
        alt={title}
        loading='lazy'
        decoding='async'
        className='aspect-[4/3] w-full rounded-lg object-cover'
      />
      <figcaption className='text-muted-foreground px-1 pb-1 text-xs'>
        {title}
      </figcaption>
    </figure>
  );
}

function MemberCard({ name, note }: { name: string; note: string }) {
  return (
    <div className={cn(CARD, 'flex-row items-center gap-3')}>
      <Avatar seed={name} />
      <span className='flex flex-col'>
        <span className='text-foreground text-[13px] font-medium'>{name}</span>
        <span className='text-muted-foreground text-xs'>{note}</span>
      </span>
    </div>
  );
}

function checkTone(done: boolean) {
  if (done) {
    return 'bg-primary text-primary-foreground';
  }
  return 'hairline-ring ring-foreground/20';
}

export function MasonryGridMixed() {
  return (
    <div className='w-full max-w-3xl px-4 py-8'>
      <MasonryGrid layout='balanced' columnWidth={200} maxColumns={3} gap={12}>
        <PhotoCard
          key='ridge'
          src='/images/scenes/scene-03.svg'
          title='Day 3, the north ridge'
        />
        <div key='plan' className={CARD}>
          <span className='text-foreground text-sm font-medium'>
            Plan for Saturday
          </span>
          <p className='text-muted-foreground text-[13px] leading-relaxed'>
            Leave the harbour at 08:30, lunch at the ridge hut, and walk down
            before the light goes. The last ferry is at 20:10.
          </p>
        </div>
        <MemberCard key='ines' name='Ines Laurent' note='Joined the trip' />
        <div key='packing' className={CARD}>
          <span className='text-foreground text-sm font-medium'>Packing</span>
          <ul className='flex flex-col gap-1.5'>
            {PACKING.map((item) => (
              <li
                key={item.label}
                className='text-foreground flex items-center gap-2 text-[13px]'
              >
                <span
                  className={cn(
                    'grid size-4 place-items-center rounded-sm',
                    checkTone(item.done)
                  )}
                >
                  {item.done && <CheckIcon className='size-3' />}
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
        <PhotoCard
          key='dunes'
          src='/images/scenes/scene-06.svg'
          title='Day 4, the dunes'
        />
        <div key='weather' className={cn(CARD, 'flex-row items-center gap-3')}>
          <span className='keycap-3d grid size-9 place-items-center rounded-lg'>
            <SunIcon className='size-4' />
          </span>
          <span className='flex flex-col'>
            <span className='text-foreground text-[13px] font-medium tabular-nums'>
              Saturday, 17 degrees
            </span>
            <span className='text-muted-foreground text-xs'>
              Clear sky, light wind from the west
            </span>
          </span>
        </div>
        <MemberCard
          key='tomas'
          name='Tomas Reyes'
          note='Booked the lake house'
        />
        <PhotoCard
          key='night'
          src='/images/scenes/scene-07.svg'
          title='Day 5, night camp'
        />
        <div key='budget' className={CARD}>
          <span className='text-muted-foreground text-xs'>Shared costs</span>
          <span className='text-foreground text-2xl font-semibold tabular-nums'>
            1,240
          </span>
          <span className='text-muted-foreground text-xs'>
            Split between 4 people
          </span>
        </div>
      </MasonryGrid>
    </div>
  );
}
