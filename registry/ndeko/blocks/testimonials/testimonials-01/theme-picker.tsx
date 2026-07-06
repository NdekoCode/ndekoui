'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { QUOTES, THEMES, type Theme, type ThemeChoice } from './data';

const THUMB =
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15';

type Choice = {
  id: ThemeChoice;
  label: string;
  count: number;
};

function countOf(choice: ThemeChoice) {
  if (choice === 'all') {
    return QUOTES.length;
  }
  const matching = QUOTES.filter((quote) => quote.theme === choice);
  return matching.length;
}

function choiceOfTheme(theme: Theme): Choice {
  return { id: theme.id, label: theme.label, count: countOf(theme.id) };
}

const ALL_CHOICE: Choice = {
  id: 'all',
  label: 'All quotes',
  count: QUOTES.length,
};

const THEME_CHOICES = THEMES.map((theme) => choiceOfTheme(theme));

const CHOICES: Choice[] = [ALL_CHOICE, ...THEME_CHOICES];

function quotesWordOf(count: number) {
  if (count === 1) {
    return '1 quote';
  }
  return `${count} quotes`;
}

export function spokenLineOf(choice: ThemeChoice) {
  const count = countOf(choice);
  if (choice === 'all') {
    return `All ${quotesWordOf(count)}`;
  }
  const theme = THEMES.find((candidate) => candidate.id === choice);
  const subject = theme?.spoken ?? '';
  return `${quotesWordOf(count)} about ${subject}`;
}

type ThemePickerProps = {
  value: ThemeChoice;
  pressed: ThemeChoice | null;
  onValueChange: (choice: ThemeChoice) => void;
};

export function ThemePicker({
  value,
  pressed,
  onValueChange,
}: ThemePickerProps) {
  const pressedValues = [value];

  /** Pressing the chosen theme again would leave nothing pressed: the choice stays. */
  function change(nextValues: unknown[]) {
    const [nextValue] = nextValues;
    const choice = CHOICES.find((candidate) => candidate.id === nextValue);
    if (choice) {
      onValueChange(choice.id);
    }
  }

  return (
    <ToggleGroup
      aria-label='Show the quotes about'
      value={pressedValues}
      onValueChange={change}
      travel
      size='sm'
      indicatorClassName={THUMB}
      className='bg-foreground/[0.05] flex-wrap rounded-lg p-0.5'
    >
      {CHOICES.map((choice) => (
        <ToggleGroupItem
          key={choice.id}
          value={choice.id}
          className={cn(
            'h-7 gap-1.5 rounded-md px-2.5 text-xs',
            pressedQuietOf(pressed === choice.id)
          )}
        >
          {choice.label}
          <span className='text-muted-foreground tabular-nums'>
            {choice.count}
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
