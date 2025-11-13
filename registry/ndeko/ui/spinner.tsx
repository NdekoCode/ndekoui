import { LoaderIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

type SpinnerProps = React.ComponentProps<'span'> & {
  label?: string;
};

function Spinner({ className, label = 'Loading', ...props }: SpinnerProps) {
  return (
    <span
      data-slot='spinner'
      role='status'
      aria-label={label}
      className={cn('text-muted-foreground inline-flex', className)}
      {...props}
    >
      <LoaderIcon className='size-4 animate-spin' />
    </span>
  );
}

export { Spinner };
