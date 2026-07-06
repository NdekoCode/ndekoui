import { cn } from '@/registry/ndeko/lib/utils';

type SampleNoteProps = {
  /** What the sample is: "Illustrative", "Sample quote". */
  children?: React.ReactNode;
  className?: string;
};

/** The word that says the figures or the words of a demo are made up. */
export function SampleNote({
  children = 'Illustrative',
  className,
}: SampleNoteProps) {
  return (
    <span className={cn('text-muted-foreground text-xs', className)}>
      {children}
    </span>
  );
}
