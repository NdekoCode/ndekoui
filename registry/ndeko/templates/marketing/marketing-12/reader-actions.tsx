import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { CheckIcon, CopyIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

function CopyLabel({ isCopied }: { isCopied: boolean }) {
  if (isCopied) {
    return (
      <span className='inline-flex items-center gap-1.5'>
        <CheckIcon />
        Copied
      </span>
    );
  }
  return (
    <span className='inline-flex items-center gap-1.5'>
      <CopyIcon />
      Copy as CSV
    </span>
  );
}

type ReaderActionsProps = {
  readCount: number;
  total: number;
  isCopied: boolean;
  isCopyPressed: boolean;
  onReadAll: () => void;
  onClear: () => void;
  onCopy: () => void;
};

export function ReaderActions({
  readCount,
  total,
  isCopied,
  isCopyPressed,
  onReadAll,
  onClear,
  onCopy,
}: ReaderActionsProps) {
  const hasRows = readCount > 0;
  const hasAllRows = readCount === total;

  return (
    <div className='flex flex-wrap items-center gap-1.5'>
      <Button
        variant='ghost'
        size='sm'
        disabled={hasAllRows}
        onClick={onReadAll}
      >
        Read all lines
      </Button>
      <Button variant='ghost' size='sm' disabled={!hasRows} onClick={onClear}>
        Clear
      </Button>
      <Button
        variant='outline'
        size='sm'
        disabled={!hasRows}
        onClick={onCopy}
        className={cn('ms-auto w-32', pressedQuietOf(isCopyPressed))}
      >
        <Swap swapKey={String(isCopied)}>
          <CopyLabel isCopied={isCopied} />
        </Swap>
      </Button>
    </div>
  );
}
