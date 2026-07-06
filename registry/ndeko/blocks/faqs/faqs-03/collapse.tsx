import { cn } from '@/registry/ndeko/lib/utils';

type CollapseProps = {
  isShown: boolean;
  className?: string;
  children: React.ReactNode;
};

/**
 * Rows that come and go while a list is filtered stay in the page: a closed row has no height,
 * no opacity and takes no focus, so the others close ranks and nothing is mounted again.
 */
export function Collapse({ isShown, className, children }: CollapseProps) {
  return (
    <div
      data-shown={isShown}
      inert={!isShown}
      className={cn(
        'grid grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity] duration-200 ease-(--ease-out-strong) data-[shown=false]:grid-rows-[0fr] data-[shown=false]:opacity-0 motion-reduce:transition-none',
        className
      )}
    >
      <div className='min-h-0 overflow-hidden'>{children}</div>
    </div>
  );
}
