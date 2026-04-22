'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId } from 'react';

import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

import type { Channel, NotificationValues, SwitchKey } from './data';
import { SETTINGS_SURFACE_BASE, SwitchRow } from './settings-kit';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const LINE_VARIANTS: Variants = {
  enter: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function lineVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LINE_VARIANTS;
}

/** A row line that swaps with the value it describes. */
export function SwappingLine({ text }: { text: string }) {
  const shouldReduceMotion = useReducedMotion();
  const variants = lineVariantsOf(shouldReduceMotion);

  return (
    <span className='relative block'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={text}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
          className='block'
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

type FoldProps = {
  isOpen: boolean;
  children: React.ReactNode;
};

/** Rows that fold into the row above them. The surface resizes, the rows below stay put. */
export function Fold({ isOpen, children }: FoldProps) {
  return (
    <AnimatedSize className='m-0' contentClassName='p-0'>
      {isOpen && (
        <div className='hairline-t border-border hairline-divide-y divide-border'>
          {children}
        </div>
      )}
    </AnimatedSize>
  );
}

type ChannelEventsProps = {
  channel: Channel;
  values: NotificationValues;
  onSwitch: (key: SwitchKey, checked: boolean) => void;
};

/** The channel switch heads its own list; turning it off folds the events away. */
export function ChannelEvents({
  channel,
  values,
  onSwitch,
}: ChannelEventsProps) {
  const headingId = useId();
  const isOn = values[channel.masterKey];
  const masterLine = masterLineOf(channel, isOn);

  function switchMaster(checked: boolean) {
    onSwitch(channel.masterKey, checked);
  }

  return (
    <section aria-labelledby={headingId} className='flex flex-col gap-3'>
      <h2 id={headingId} className='text-sm font-medium'>
        {channel.eventsTitle}
      </h2>
      <div className={SETTINGS_SURFACE_BASE}>
        <SwitchRow
          label={channel.masterLabel}
          line={<SwappingLine text={masterLine} />}
          checked={isOn}
          onCheckedChange={switchMaster}
        />
        <Fold isOpen={isOn}>
          {channel.events.map((event) => {
            function switchEvent(checked: boolean) {
              onSwitch(event.key, checked);
            }

            return (
              <SwitchRow
                key={event.key}
                label={event.label}
                line={event.line}
                checked={values[event.key]}
                onCheckedChange={switchEvent}
              />
            );
          })}
        </Fold>
      </div>
    </section>
  );
}

function masterLineOf(channel: Channel, isOn: boolean) {
  if (isOn) {
    return channel.masterLine;
  }
  return channel.offLine;
}
