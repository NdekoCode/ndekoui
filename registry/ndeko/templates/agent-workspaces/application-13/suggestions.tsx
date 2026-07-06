'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import {
  CodeIcon,
  PencilIcon,
  SearchIcon,
  TableIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

import { SUGGESTIONS, type Suggestion, type SuggestionKind } from './data';

const KIND_ICON: Record<SuggestionKind, Icon> = {
  data: TableIcon,
  writing: PencilIcon,
  search: SearchIcon,
  code: CodeIcon,
};

/** The card whose task sits in the prompt keeps a ring, so the pick stays visible after the press. */
function pickedOf(isPicked: boolean) {
  if (isPicked) {
    return 'ring-primary/45';
  }
  return 'ring-border hover:bg-foreground/[0.03]';
}

type SuggestionCardProps = {
  suggestion: Suggestion;
  isPicked: boolean;
  isPressed: boolean;
  onPick: (prompt: string) => void;
};

function SuggestionCard({
  suggestion,
  isPicked,
  isPressed,
  onPick,
}: SuggestionCardProps) {
  const KindIcon = KIND_ICON[suggestion.kind];

  function pick() {
    onPick(suggestion.prompt);
  }

  return (
    <li className='flex'>
      <button
        type='button'
        data-solid
        aria-pressed={isPicked}
        onClick={pick}
        className={cn(
          'bg-card hairline-ring focus-visible:ring-ring dark:bg-foreground/[0.04] flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl p-2.5 text-start shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[background-color,box-shadow,scale] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-2 active:scale-[0.97]',
          pickedOf(isPicked),
          pressedQuietOf(isPressed)
        )}
      >
        <span
          aria-hidden='true'
          className='keycap-3d text-muted-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-lg'
        >
          <KindIcon className='size-4' />
        </span>
        <span className='flex min-w-0 flex-col leading-tight'>
          <span className='truncate text-[13px] font-medium'>
            {suggestion.title}
          </span>
          <span className='text-muted-foreground truncate text-xs'>
            {suggestion.hint}
          </span>
        </span>
      </button>
    </li>
  );
}

type SuggestionsProps = {
  draft: string;
  pressed: string | null;
  onPick: (prompt: string) => void;
};

export function Suggestions({ draft, pressed, onPick }: SuggestionsProps) {
  return (
    <ul
      aria-label='Suggested tasks'
      className='grid grid-cols-1 gap-2 @md:grid-cols-2'
    >
      {SUGGESTIONS.map((suggestion) => {
        const pressKey = `suggestion-${suggestion.id}`;
        return (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            isPicked={draft === suggestion.prompt}
            isPressed={pressed === pressKey}
            onPick={onPick}
          />
        );
      })}
    </ul>
  );
}
