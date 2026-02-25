import { InfiniteSlider } from '@/components/core/infinite-slider';
import { HeadphonesIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

const TONES = [
  { tile: 'bg-primary/10', gem: '[--gem:var(--primary)]' },
  { tile: 'bg-success/10', gem: '[--gem:var(--success)]' },
  { tile: 'bg-warning/10', gem: '[--gem:var(--warning)]' },
  { tile: 'bg-info/10', gem: '[--gem:var(--info)]' },
  { tile: 'bg-foreground/[0.04]', gem: '[--gem:var(--muted-foreground)]' },
];

type Playlist = {
  title: string;
  tracks: number;
};

function PlaylistTile({
  playlist,
  index,
}: {
  playlist: Playlist;
  index: number;
}) {
  const tone = TONES[index % TONES.length];

  return (
    <div
      className={cn(
        'flex aspect-square w-[120px] flex-col justify-between rounded-lg p-2.5',
        tone.tile
      )}
    >
      <span
        className={cn(
          'gem-plate grid size-7 place-items-center rounded-md',
          tone.gem
        )}
      >
        <HeadphonesIcon className='size-3.5' />
      </span>
      <span className='flex flex-col'>
        <span className='text-foreground text-xs font-medium'>
          {playlist.title}
        </span>
        <span className='text-muted-foreground text-xs tabular-nums'>
          {playlist.tracks} tracks
        </span>
      </span>
    </div>
  );
}

const FIRST_COLUMN: Playlist[] = [
  { title: 'Deep focus', tracks: 42 },
  { title: 'Morning run', tracks: 28 },
  { title: 'Rainy commute', tracks: 35 },
  { title: 'Sunday kitchen', tracks: 19 },
  { title: 'Late night drive', tracks: 31 },
  { title: 'Study hall', tracks: 54 },
];

const SECOND_COLUMN: Playlist[] = [
  { title: 'Garden hours', tracks: 23 },
  { title: 'Long flight', tracks: 61 },
  { title: 'Coffee shop', tracks: 37 },
  { title: 'Warm up', tracks: 16 },
  { title: 'Wind down', tracks: 26 },
  { title: 'Road trip', tracks: 48 },
];

export function InfiniteSliderVertical() {
  return (
    <div className='flex h-[350px] space-x-4'>
      <InfiniteSlider direction='vertical'>
        {FIRST_COLUMN.map((playlist, index) => (
          <PlaylistTile
            key={playlist.title}
            playlist={playlist}
            index={index}
          />
        ))}
      </InfiniteSlider>
      <InfiniteSlider direction='vertical' reverse>
        {SECOND_COLUMN.map((playlist, index) => {
          const toneIndex = index + 2;

          return (
            <PlaylistTile
              key={playlist.title}
              playlist={playlist}
              index={toneIndex}
            />
          );
        })}
      </InfiniteSlider>
    </div>
  );
}
