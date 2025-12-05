'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

const TOAST_BUTTON_PRESS =
  'transition-[background-color,scale] duration-150 ease-(--ease-out-strong) active:scale-[0.97]';

const TOAST_CLASS_NAMES = {
  toast:
    'surface-raised group/toast flex w-[var(--width)] items-start gap-3 rounded-2xl p-4 text-[13px] text-popover-foreground',
  title: 'font-medium text-foreground',
  description: 'mt-0.5 text-[13px] text-muted-foreground',
  content: 'flex min-w-0 flex-1 flex-col',
  icon: 'flex shrink-0 [&>*]:shrink-0',
  actionButton: `ms-auto inline-flex h-7 shrink-0 cursor-pointer items-center rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground shadow-[0_1px_2px_rgb(0_0_0/0.14),inset_0_1px_0_rgb(255_255_255/0.12)] outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${TOAST_BUTTON_PRESS}`,
  cancelButton: `inline-flex h-7 shrink-0 cursor-pointer items-center rounded-full bg-card px-3 text-xs font-medium text-foreground hairline-ring ring-foreground/12 outline-none hover:bg-foreground/[0.03] ${TOAST_BUTTON_PRESS}`,
  closeButton:
    'absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full bg-popover text-muted-foreground hairline-ring ring-border hover:text-foreground',
};

const TOAST_ICONS = {
  success: <StatusOrb tone='success' />,
  error: <StatusOrb tone='error' />,
  warning: <StatusOrb tone='warning' />,
  info: <StatusOrb tone='info' />,
  loading: <StatusOrb tone='loading' />,
};

const TOAST_WIDTH = { '--width': '22rem' } as React.CSSProperties;

function Toaster({ toastOptions, ...props }: ToasterProps) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme as ToasterProps['theme'];

  return (
    <Sonner
      theme={theme}
      position='bottom-right'
      visibleToasts={3}
      gap={8}
      icons={TOAST_ICONS}
      style={TOAST_WIDTH}
      toastOptions={{
        unstyled: true,
        classNames: TOAST_CLASS_NAMES,
        ...toastOptions,
      }}
      {...props}
    />
  );
}

export { Toaster };
