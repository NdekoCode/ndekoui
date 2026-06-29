'use client';

import { useState } from 'react';

import { ReorderList } from '@/components/core/reorder-list';

type Track = {
  id: string;
  title: string;
  artist: string;
  length: string;
};

const QUEUE: Track[] = [
  {
    id: 'tide',
    title: 'Low Tide',
    artist: 'The Marrow Lights',
    length: '3:42',
  },
  {
    id: 'paper',
    title: 'Paper Lanterns',
    artist: 'Ines Valcourt',
    length: '4:05',
  },
  {
    id: 'north',
    title: 'North Window',
    artist: 'Halvard Quartet',
    length: '5:18',
  },
  { id: 'static', title: 'Soft Static', artist: 'June Arden', length: '2:57' },
  {
    id: 'harbour',
    title: 'Harbour Lights',
    artist: 'Okoye & Lind',
    length: '3:30',
  },
];

function keyOf(track: Track) {
  return track.id;
}

function labelOf(track: Track) {
  return track.title;
}

function renderTrack(track: Track) {
  return (
    <span className='flex items-center gap-3'>
      <span className='flex min-w-0 flex-1 flex-col'>
        <span className='text-foreground truncate text-[13px] font-medium'>
          {track.title}
        </span>
        <span className='text-muted-foreground truncate text-xs'>
          {track.artist}
        </span>
      </span>
      <span className='text-muted-foreground text-xs tabular-nums'>
        {track.length}
      </span>
    </span>
  );
}

export function ReorderListQueue() {
  const [queue, setQueue] = useState(QUEUE);

  return (
    <ReorderList
      aria-label='Up next'
      className='w-full max-w-sm'
      items={queue}
      onReorder={setQueue}
      getKey={keyOf}
      getLabel={labelOf}
      renderItem={renderTrack}
    />
  );
}
