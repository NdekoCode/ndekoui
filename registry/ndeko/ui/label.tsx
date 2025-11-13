import { cn } from '@/registry/ndeko/lib/utils';

const LABEL_RECIPE =
  'flex select-none items-center gap-2 text-[13px] font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-50 group-data-disabled:pointer-events-none group-data-disabled:opacity-50';

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      data-slot='label'
      className={cn(LABEL_RECIPE, className)}
      {...props}
    />
  );
}

export { Label, LABEL_RECIPE };
