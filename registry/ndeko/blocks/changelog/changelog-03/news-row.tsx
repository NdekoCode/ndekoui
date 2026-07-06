'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Chip } from '@/registry/ndeko/ui/chip';

import { KIND_STYLES, type Note } from './data';

function dotOf(isUnread: boolean) {
  if (isUnread) {
    return 'scale-100 opacity-100';
  }
  return 'scale-0 opacity-0';
}

function titleToneOf(isUnread: boolean) {
  if (isUnread) {
    return 'font-medium text-foreground';
  }
  return 'text-muted-foreground';
}

type NewsRowProps = {
  note: Note;
  isUnread: boolean;
  isPressed: boolean;
  onRead: (id: string) => void;
};

export function NewsRow({ note, isUnread, isPressed, onRead }: NewsRowProps) {
  const kind = KIND_STYLES[note.kind];

  return (
    <li>
      <a
        href={note.href}
        onClick={() => onRead(note.id)}
        className={cn(
          'hover:bg-foreground/[0.04] flex items-start gap-3 rounded-md px-2.5 py-2.5 transition-colors duration-100',
          pressedQuietOf(isPressed),
          FOCUS_RING
        )}
      >
        <span
          aria-hidden='true'
          className='mt-[7px] flex size-2 shrink-0 items-center justify-center'
        >
          <span
            className={cn(
              'bg-primary size-2 rounded-full transition-[scale,opacity] duration-200 ease-(--ease-out-strong)',
              dotOf(isUnread)
            )}
          />
        </span>
        <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <span className='flex items-baseline gap-2'>
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-[13px] transition-colors duration-200',
                titleToneOf(isUnread)
              )}
            >
              {note.title}
              {isUnread && <span className='sr-only'>, unread</span>}
            </span>
            <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
              {note.date}
            </span>
          </span>
          <span className='text-muted-foreground line-clamp-1 text-xs'>
            {note.summary}
          </span>
        </span>
        <Chip color={kind.color} className='mt-0.5 hidden @sm:inline-flex'>
          {kind.label}
        </Chip>
      </a>
    </li>
  );
}
