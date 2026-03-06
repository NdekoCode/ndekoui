// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import {
  CircleAlertIcon,
  InfoIcon,
  TriangleAlertIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

type SystemMessageVariant = 'action' | 'error' | 'warning';

type SystemMessageCta = {
  label: string;
  onClick?: () => void;
  variant?: 'solid' | 'outline' | 'ghost';
};

const FILLED: Record<SystemMessageVariant, string> = {
  action: 'bg-foreground/[0.04] text-foreground dark:bg-foreground/[0.06]',
  error: 'bg-destructive/10 text-destructive-ink',
  warning: 'bg-warning/10 text-warning-foreground',
};

const OUTLINED: Record<SystemMessageVariant, string> = {
  action: 'text-foreground hairline-ring ring-border',
  error: 'text-destructive-ink hairline-ring ring-destructive/35',
  warning: 'text-warning-foreground hairline-ring ring-warning/40',
};

const ICON_COLOR: Record<SystemMessageVariant, string> = {
  action: 'text-muted-foreground',
  error: '',
  warning: '',
};

const DEFAULT_ICON: Record<SystemMessageVariant, React.ReactNode> = {
  action: <InfoIcon />,
  error: <CircleAlertIcon />,
  warning: <TriangleAlertIcon />,
};

const CTA_VARIANT = {
  solid: 'default',
  outline: 'outline',
  ghost: 'ghost',
} as const;

function surfaceOf(variant: SystemMessageVariant, fill: boolean) {
  if (fill) {
    return FILLED[variant];
  }
  return OUTLINED[variant];
}

function iconOf(
  variant: SystemMessageVariant,
  icon: React.ReactNode,
  isIconHidden: boolean
) {
  if (isIconHidden) {
    return null;
  }
  return icon ?? DEFAULT_ICON[variant];
}

type SystemMessageProps = React.ComponentProps<'div'> & {
  variant?: SystemMessageVariant;
  fill?: boolean;
  icon?: React.ReactNode;
  isIconHidden?: boolean;
  cta?: SystemMessageCta;
};

function SystemMessage({
  children,
  variant = 'action',
  fill = false,
  icon,
  isIconHidden = false,
  cta,
  className,
  ...props
}: SystemMessageProps) {
  const shownIcon = iconOf(variant, icon, isIconHidden);
  const hasIcon = shownIcon !== null;
  const ctaVariant = CTA_VARIANT[cta?.variant ?? 'solid'];

  return (
    <div
      data-slot='system-message'
      data-variant={variant}
      className={cn(
        'flex items-center gap-3 rounded-xl py-2 ps-3 pe-2 text-[13px] leading-normal',
        surfaceOf(variant, fill),
        className
      )}
      {...props}
    >
      {hasIcon && (
        <span
          aria-hidden='true'
          className={cn(
            'flex h-[1lh] shrink-0 items-center self-start [&_svg]:size-4',
            ICON_COLOR[variant]
          )}
        >
          {shownIcon}
        </span>
      )}
      <div className='min-w-0 flex-1'>{children}</div>
      {cta && (
        <Button
          type='button'
          size='sm'
          variant={ctaVariant}
          onClick={cta.onClick}
        >
          {cta.label}
        </Button>
      )}
    </div>
  );
}

export { SystemMessage, type SystemMessageProps, type SystemMessageVariant };
