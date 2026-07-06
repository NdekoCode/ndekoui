'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { rowPresenceOf, SPRING } from '@/registry/ndeko/lib/motion-presets';

export const SURFACE =
  'bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-foreground/[0.03]';

const NUDGE = { initial: { x: 4 }, animate: { x: 0 } };

const STILL = { initial: false, animate: { x: 0 } };

function nudgeOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return STILL;
  }
  return NUDGE;
}

export function describedByOf(hasError: boolean, errorId: string) {
  if (hasError) {
    return errorId;
  }
  return undefined;
}

type SettingsFrameProps = {
  ref?: React.Ref<HTMLDivElement>;
  title: string;
  line: string;
  /** Sits beside the title: the Replay of the demonstration. */
  aside?: React.ReactNode;
  children: React.ReactNode;
};

/** A settings page that follows its own width: one column, the title above, the sections under it. */
export function SettingsFrame({
  ref,
  title,
  line,
  aside,
  children,
}: SettingsFrameProps) {
  return (
    <div
      ref={ref}
      className='bg-background text-foreground @container min-h-dvh w-full'
    >
      <div className='mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 @2xl:px-6 @2xl:py-10'>
        <header className='flex flex-wrap items-start gap-x-3 gap-y-2'>
          <div className='flex min-w-0 flex-1 basis-64 flex-col gap-1'>
            <h1 className='text-2xl font-semibold text-balance @xl:text-3xl'>
              {title}
            </h1>
            <p className='text-muted-foreground text-[13px] text-pretty'>
              {line}
            </p>
          </div>
          {aside}
        </header>
        {children}
      </div>
    </div>
  );
}

type SettingsSectionProps = {
  title: string;
  line?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function SettingsSection({
  title,
  line,
  action,
  children,
}: SettingsSectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className='flex flex-col gap-3'>
      <div className='flex flex-wrap items-end justify-between gap-x-3 gap-y-2'>
        <div className='flex min-w-0 flex-col gap-0.5'>
          <h2 id={headingId} className='text-sm font-medium'>
            {title}
          </h2>
          {line && (
            <p className='text-muted-foreground text-xs text-pretty'>{line}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

type ErrorLineProps = {
  /** The field points to it with `aria-describedby` while it shows. */
  id: string;
  error: string | null;
  /** A new refusal of the same entry nudges the line again. */
  attempts: number;
};

/** A refusal grows in under its field, nudges 4px, and folds away once the person types again. */
export function ErrorLine({ id, error, attempts }: ErrorLineProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = rowPresenceOf(shouldReduceMotion);
  const nudge = nudgeOf(shouldReduceMotion);

  return (
    <AnimatePresence initial={false}>
      {error && (
        <motion.div key='error' className='overflow-hidden' {...presence}>
          <motion.p
            key={attempts}
            id={id}
            className='text-destructive-ink pt-0.5 text-xs text-pretty'
            transition={SPRING}
            {...nudge}
          >
            {error}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
