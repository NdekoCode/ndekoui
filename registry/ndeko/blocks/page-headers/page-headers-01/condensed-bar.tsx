import { PencilIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';

const SHOWN = 'translate-y-0 opacity-100';

const HIDDEN = '-translate-y-full opacity-0';

function placeOf(isShown: boolean) {
  if (isShown) {
    return SHOWN;
  }
  return HIDDEN;
}

function hiddenOf(isShown: boolean) {
  if (isShown) {
    return undefined;
  }
  return true;
}

type CondensedBarProps = {
  isShown: boolean;
  title: string;
  statusLabel: string;
  statusColor: string;
  progress: number;
  onEdit: () => void;
};

export function CondensedBar({
  isShown,
  title,
  statusLabel,
  statusColor,
  progress,
  onEdit,
}: CondensedBarProps) {
  const progressStyle = { transform: `scaleX(${progress})` };

  return (
    <div
      inert={!isShown}
      aria-hidden={hiddenOf(isShown)}
      className={cn(
        'bg-background hairline-b border-border absolute inset-x-0 top-0 transition-[translate,opacity] duration-200 ease-(--ease-out-strong)',
        placeOf(isShown)
      )}
    >
      <div className='mx-auto flex h-12 max-w-5xl items-center gap-3 px-4 @2xl:px-8'>
        <p className='min-w-0 truncate text-sm font-semibold'>{title}</p>
        <Chip color={statusColor}>{statusLabel}</Chip>
        <span className='flex-1' />
        <Button type='button' size='sm' onClick={onEdit}>
          <PencilIcon />
          Edit
        </Button>
      </div>
      <span
        aria-hidden='true'
        style={progressStyle}
        className='bg-primary absolute inset-x-0 bottom-0 h-0.5 origin-left'
      />
    </div>
  );
}
