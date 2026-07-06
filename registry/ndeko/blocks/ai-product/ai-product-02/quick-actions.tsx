import {
  BotIcon,
  PlugIcon,
  PlusIcon,
  UserRoundPlusIcon,
} from '@/registry/ndeko/lib/icons';

import { ACTIONS, type ActionId, type QuickAction } from './data';

const GLYPHS: Record<ActionId, typeof PlusIcon> = {
  task: PlusIcon,
  agent: BotIcon,
  app: PlugIcon,
  invite: UserRoundPlusIcon,
};

function ActionTile({ action }: { action: QuickAction }) {
  const Glyph = GLYPHS[action.id];

  return (
    <a
      href='#'
      className='bg-foreground/[0.03] hover:bg-foreground/[0.05] focus-visible:ring-ring/25 flex items-center gap-3 rounded-xl p-3 transition-[background-color,scale] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-[3px] active:scale-[0.97]'
    >
      <span
        aria-hidden='true'
        className='keycap-3d text-muted-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-lg'
      >
        <Glyph className='size-4' />
      </span>
      <span className='flex min-w-0 flex-col'>
        <span className='truncate text-[13px] font-medium'>{action.label}</span>
        <span className='text-muted-foreground truncate text-xs'>
          {action.hint}
        </span>
      </span>
    </a>
  );
}

export function QuickActions() {
  return (
    <ul
      aria-label='Quick actions'
      className='grid gap-3 @lg:grid-cols-2 @4xl:grid-cols-4'
    >
      {ACTIONS.map((action) => (
        <li key={action.id}>
          <ActionTile action={action} />
        </li>
      ))}
    </ul>
  );
}
