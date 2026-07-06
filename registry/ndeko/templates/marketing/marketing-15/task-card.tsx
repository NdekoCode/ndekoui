import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import type { TaskCard } from './data';

export function TaskCardView({ card }: { card: TaskCard }) {
  return (
    <li className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex w-64 shrink-0 flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] select-none'>
      <p className='line-clamp-2 min-h-[2.5rem] text-[13px] leading-snug font-medium text-balance'>
        {card.title}
      </p>
      <div className='flex items-center gap-2 text-xs'>
        <MeshTile seed={card.project} />
        <span className='text-muted-foreground truncate'>{card.project}</span>
        <Badge variant='secondary' className='ms-auto'>
          Due {card.due}
        </Badge>
        <Avatar
          seed={card.assignee}
          role='img'
          aria-label={card.assignee}
          className='size-6'
        />
      </div>
    </li>
  );
}
