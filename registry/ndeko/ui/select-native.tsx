import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';

function SelectNative({
  className,
  children,
  multiple,
  ...props
}: React.ComponentProps<'select'>) {
  const isMultiple = Boolean(multiple);

  return (
    <div className='relative flex'>
      <select
        data-slot='select-native'
        multiple={multiple}
        className={cn(
          CONTROL_RECIPE,
          'peer cursor-pointer appearance-none',
          isMultiple &&
            '[&_option:checked]:bg-foreground/5 py-1 *:px-2.5 *:py-1',
          !isMultiple && 'h-8 ps-2.5 pe-8',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {!isMultiple && (
        <span className='text-muted-foreground peer-aria-invalid:text-destructive-ink pointer-events-none absolute inset-y-0 end-0 flex h-full w-8 items-center justify-center peer-disabled:opacity-50'>
          <ChevronDownIcon className='size-4' />
        </span>
      )}
    </div>
  );
}

export { SelectNative };
