import { cn } from '@/registry/ndeko/lib/utils';

const SQUEEZE = 0.74;

const SQUEEZED_STYLE = {
  width: `${100 / SQUEEZE}%`,
  transform: `scaleX(${SQUEEZE})`,
};

type CondensedProps = {
  className?: string;
  children: React.ReactNode;
};

/** The text is laid out wider than its box and squeezed back in, which is how the face gets its condensed width. */
export function Condensed({ className, children }: CondensedProps) {
  return (
    <span
      style={SQUEEZED_STYLE}
      className={cn(
        'block origin-left leading-[0.92] font-semibold tracking-[-0.03em]',
        className
      )}
    >
      {children}
    </span>
  );
}
