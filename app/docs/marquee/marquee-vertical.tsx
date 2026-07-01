import { Marquee } from '@/components/core/marquee';

type ReleaseNote = {
  version: string;
  note: string;
};

const NOTES: ReleaseNote[] = [
  { version: '2.4.0', note: 'Boards remember the last filter you used' },
  { version: '2.3.2', note: 'Export a sprint as a CSV from its menu' },
  { version: '2.3.0', note: 'Press G then B to jump to your boards' },
  { version: '2.2.1', note: 'Due dates follow your time zone' },
  { version: '2.2.0', note: 'Archive a project without losing its history' },
  { version: '2.1.0', note: 'Mentions notify people who follow the task' },
];

export function MarqueeVertical() {
  return (
    <Marquee
      direction='vertical'
      gap={12}
      className='h-[320px] w-full max-w-xs px-1'
    >
      {NOTES.map((release) => (
        <div
          key={release.version}
          className='bg-foreground/[0.04] flex flex-col gap-1 rounded-xl px-3.5 py-3'
        >
          <span className='text-muted-foreground font-mono text-xs tabular-nums'>
            {release.version}
          </span>
          <span className='text-foreground text-[13px]'>{release.note}</span>
        </div>
      ))}
    </Marquee>
  );
}
