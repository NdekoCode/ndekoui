import {
  CheckIcon,
  InfoIcon,
  LoaderIcon,
  TriangleAlertIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

type StatusOrbTone =
  'success' | 'error' | 'warning' | 'info' | 'loading' | 'neutral' | 'brand';

const TONE_COLOR: Record<StatusOrbTone, string> = {
  success: 'var(--success)',
  error: 'var(--destructive)',
  warning: 'var(--warning)',
  info: 'var(--info)',
  loading: 'var(--primary)',
  neutral: 'var(--muted-foreground)',
  brand: 'var(--primary)',
};

const DEFAULT_GLYPH: Record<StatusOrbTone, React.ReactNode> = {
  success: <CheckIcon strokeWidth={2.5} />,
  error: <XIcon strokeWidth={2.5} />,
  warning: <TriangleAlertIcon strokeWidth={2.25} />,
  info: <InfoIcon strokeWidth={2.25} />,
  loading: <LoaderIcon strokeWidth={2.25} className='animate-spin' />,
  neutral: <InfoIcon strokeWidth={2.25} />,
  brand: <InfoIcon strokeWidth={2.25} />,
};

const SIZE_CLASS = {
  md: {
    bezel:
      'size-8 p-[3px] shadow-[0_0_0_var(--hairline)_var(--border),0_0_0_4px_color-mix(in_oklab,var(--orb)_10%,transparent),0_0_0_8px_color-mix(in_oklab,var(--orb)_5%,transparent),0_1px_2px_rgb(0_0_0/0.08),0_3px_8px_-2px_color-mix(in_oklab,var(--orb)_45%,transparent)]',
    glyph: '[&_svg]:size-3.5',
  },
  sm: {
    bezel:
      'size-6 p-0.5 shadow-[0_0_0_var(--hairline)_var(--border),0_1px_2px_rgb(0_0_0/0.08),0_3px_8px_-2px_color-mix(in_oklab,var(--orb)_45%,transparent)]',
    glyph: '[&_svg]:size-3',
  },
} as const;

const DISC =
  'flex size-full animate-orb-arrive items-center justify-center rounded-full text-[color-mix(in_oklab,var(--orb)_12%,white)] bg-[radial-gradient(circle_at_50%_18%,color-mix(in_oklab,var(--orb)_62%,white),var(--orb)_58%,color-mix(in_oklab,var(--orb)_82%,black))] shadow-[inset_0_1px_0_rgb(255_255_255/0.35),inset_0_-1px_1px_rgb(0_0_0/0.12)]';

type StatusOrbProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  tone: StatusOrbTone;
  glyph?: React.ReactNode;
  size?: keyof typeof SIZE_CLASS;
};

/** The mark of a message's kind, in toasts, notices and confirmations. It arrives out of focus and settles when it mounts. */
function StatusOrb({
  tone,
  glyph,
  size = 'md',
  className,
  style,
  ...props
}: StatusOrbProps) {
  const orbStyle = {
    '--orb': TONE_COLOR[tone],
    ...style,
  } as React.CSSProperties;
  const sizeClass = SIZE_CLASS[size];
  const content = glyph ?? DEFAULT_GLYPH[tone];

  return (
    <span
      data-slot='status-orb'
      aria-hidden='true'
      style={orbStyle}
      className={cn(
        'bg-popover dark:bg-foreground/[0.06] inline-flex shrink-0 rounded-full',
        sizeClass.bezel,
        className
      )}
      {...props}
    >
      <span key={tone} className={cn(DISC, sizeClass.glyph)}>
        {content}
      </span>
    </span>
  );
}

export { StatusOrb, type StatusOrbTone };
