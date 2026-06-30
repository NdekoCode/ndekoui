import { CopyButton } from '@/app/_site/copy-button';
import { cn } from '@/registry/ndeko/lib/utils';

type CopyFieldProps = {
  value: string;
  label: string;
  className?: string;
};

/** A value to paste somewhere else, on one line, with the button that copies it. */
export function CopyField({ value, label, className }: CopyFieldProps) {
  return (
    <div
      className={cn(
        'bg-foreground/[0.04] flex min-w-0 items-center gap-2 rounded-lg py-1 ps-3 pe-1',
        className
      )}
    >
      <code className='min-w-0 flex-1 truncate font-mono text-xs'>{value}</code>
      <CopyButton value={value} label={label} />
    </div>
  );
}
