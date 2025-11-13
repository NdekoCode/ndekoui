import { CheckIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

type SelectedMarkProps = React.ComponentProps<'span'> & {
  /** Read by screen readers. Leave it out when the row already says it is selected (aria-checked, aria-selected). */
  label?: string;
};

function SelectedMark({ className, label, ...props }: SelectedMarkProps) {
  const hasLabel = Boolean(label);

  return (
    <span
      data-slot='selected-mark'
      aria-hidden={!hasLabel}
      className={cn(
        'chip-3d inline-flex size-[18px] shrink-0 items-center justify-center rounded-full [--chip:var(--primary)]',
        className
      )}
      {...props}
    >
      <CheckIcon strokeWidth={2.5} className='size-3' />
      {hasLabel && <span className='sr-only'>{label}</span>}
    </span>
  );
}

export { SelectedMark };
