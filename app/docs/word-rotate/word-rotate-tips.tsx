import { WordRotate } from '@/components/core/word-rotate';
import { LightbulbIcon } from '@/registry/ndeko/lib/icons';

const TIPS = [
  'Press N to start a new note',
  'Drag a card to change its status',
  'Type @ to mention a teammate',
  'Press / to search every project',
];

export function WordRotateTips() {
  return (
    <div className='bg-card hairline-ring ring-border flex w-full max-w-sm items-center gap-2.5 rounded-xl px-4 py-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <LightbulbIcon
        aria-hidden='true'
        className='text-muted-foreground size-4 shrink-0'
      />
      <p className='text-muted-foreground min-w-0 text-[13px]'>
        <WordRotate
          words={TIPS}
          interval={4}
          direction='down'
          accessibleText='Tips: press N to start a new note, drag a card to change its status, type @ to mention a teammate, press / to search every project'
        />
      </p>
    </div>
  );
}
