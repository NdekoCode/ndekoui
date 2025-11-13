import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        CONTROL_RECIPE,
        'field-sizing-content max-h-[12lh] min-h-16 resize-none px-2.5 py-2 leading-normal',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
