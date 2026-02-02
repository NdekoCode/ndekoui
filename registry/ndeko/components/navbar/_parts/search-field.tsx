import { SearchIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Input, type InputProps } from '@/registry/ndeko/ui/input';

type SearchFieldProps = Omit<InputProps, 'type'> & {
  end?: React.ReactNode;
  containerClassName?: string;
};

function SearchField({
  end,
  className,
  containerClassName,
  ...props
}: SearchFieldProps) {
  const hasEnd = end !== undefined;

  return (
    <div className={cn('relative', containerClassName)}>
      <Input
        type='search'
        placeholder='Search…'
        aria-label='Search'
        className={cn('peer ps-8', hasEnd && 'pe-10', className)}
        {...props}
      />
      <span
        aria-hidden='true'
        className='text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center ps-2.5 peer-disabled:opacity-50'
      >
        <SearchIcon className='size-4' />
      </span>
      {hasEnd && (
        <span className='absolute inset-y-0 end-0 flex items-center pe-1.5'>
          {end}
        </span>
      )}
    </div>
  );
}

export { SearchField };
