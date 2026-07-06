import { cn } from '@/registry/ndeko/lib/utils';
import { Kbd, KbdGroup } from '@/registry/ndeko/ui/kbd';

export type ListKey = 'move' | 'enter' | 'tab' | 'escape';

const KEY_MOTION = 'transition-[scale,background-color,color] duration-150';

const PRESSED = 'scale-90 bg-primary/15 text-primary-ink';

function pressedOf(isPressed: boolean) {
  if (isPressed) {
    return PRESSED;
  }
  return undefined;
}

type ListKeysProps = {
  /** The key a demonstration is holding down. */
  pressed: ListKey | null;
  /** Adds Tab, for a list that has groups to jump between. */
  hasGroups?: boolean;
  enterLabel?: string;
  className?: string;
};

export function ListKeys({
  pressed,
  hasGroups = false,
  enterLabel = 'picks',
  className,
}: ListKeysProps) {
  const moveClass = cn(KEY_MOTION, pressedOf(pressed === 'move'));
  const enterClass = cn(KEY_MOTION, pressedOf(pressed === 'enter'));
  const tabClass = cn(KEY_MOTION, pressedOf(pressed === 'tab'));
  const escapeClass = cn(KEY_MOTION, pressedOf(pressed === 'escape'));

  return (
    <p
      className={cn(
        'text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs',
        className
      )}
    >
      <span className='inline-flex items-center gap-1'>
        <KbdGroup aria-hidden='true'>
          <Kbd className={moveClass}>↑</Kbd>
          <Kbd className={moveClass}>↓</Kbd>
        </KbdGroup>
        <span className='sr-only'>Up and Down arrows</span>
        move
      </span>
      <span className='inline-flex items-center gap-1'>
        <Kbd className={enterClass}>Enter</Kbd> {enterLabel}
      </span>
      {hasGroups && (
        <span className='inline-flex items-center gap-1'>
          <Kbd className={tabClass}>Tab</Kbd> next group
        </span>
      )}
      <span className='inline-flex items-center gap-1'>
        <Kbd className={escapeClass}>Esc</Kbd> closes
      </span>
    </p>
  );
}
