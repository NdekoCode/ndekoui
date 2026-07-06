import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { ArrowUpIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

type PromptFieldProps = {
  typed: string;
  /** Shows the caret after the text. */
  isTyping: boolean;
  /** Holds the send key down. */
  isSending: boolean;
  /** The line leaves upwards, as a request that has just been sent. */
  isSent?: boolean;
  /** A new key starts the next line in place, so it does not come back down the way the last one left. */
  lineKey?: number;
};

/** The drawing of a prompt field for a scene: a line that a script types, and a send key it presses. */
export function PromptField({
  typed,
  isTyping,
  isSending,
  isSent = false,
  lineKey = 0,
}: PromptFieldProps) {
  return (
    <div className='bg-card hairline-ring ring-border flex h-10 items-center gap-2 rounded-xl ps-3.5 pe-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.05)]'>
      <p
        key={lineKey}
        data-sent={isSent}
        className='min-w-0 flex-1 truncate text-[13px] leading-5 transition-[opacity,translate] duration-200 ease-(--ease-out-strong) data-[sent=true]:-translate-y-2 data-[sent=true]:opacity-0'
      >
        {typed}
        {isTyping && (
          <span className='bg-foreground ms-px inline-block h-4 w-px align-text-bottom' />
        )}
      </p>
      <span
        className={cn(
          'bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full transition-[scale,background-color] duration-150 ease-(--ease-out-strong)',
          pressedSolidOf(isSending)
        )}
      >
        <ArrowUpIcon className='size-4' />
      </span>
    </div>
  );
}
