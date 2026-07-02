'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

import { Iphone } from '@/components/core/iphone';
import { Safari } from '@/components/core/safari';
import { cn } from '@/registry/ndeko/lib/utils';

import { LiveFrame } from './live-frame';

const WIDE_TEMPLATE = '/view/templates/marketing/marketing-01';
const SECOND_TEMPLATE = '/view/templates/application/application-02';

const DESKTOP_WIDTH = 1280;
const DESKTOP_HEIGHT = 800;
const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;

/** The phones drift a little with the scroll, each at its own pace. Reduced motion drops the drift in CSS. */
const DRIFTING = 'absolute motion-reduce:transform-none!';

const SCROLL_OFFSET = ['start end', 'end start'] as const;

type PhoneProps = {
  src: string;
  title: string;
  label: string;
};

function Phone({ src, title, label }: PhoneProps) {
  return (
    <Iphone label={label}>
      <LiveFrame
        src={src}
        title={title}
        frameWidth={PHONE_WIDTH}
        frameHeight={PHONE_HEIGHT}
        className='absolute inset-0'
      />
    </Iphone>
  );
}

/** One template on a wide screen, the same one on a phone, and a second template on another phone. */
export function EveryScreen() {
  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: [...SCROLL_OFFSET],
  });
  const leftDrift = useTransform(scrollYProgress, [0, 1], [32, -32]);
  const rightDrift = useTransform(scrollYProgress, [0, 1], [56, -40]);

  return (
    <div
      ref={stageRef}
      className='relative mx-auto w-full max-w-5xl px-[4%] pb-[16%] sm:px-[10%]'
    >
      <Safari
        url='ui.ndekocode.dev/templates'
        mode='simple'
        label='The Loomboard template on a wide screen'
        className='shadow-[0_32px_80px_-32px_rgb(30_27_75/0.35)]'
      >
        <LiveFrame
          src={WIDE_TEMPLATE}
          title='Loomboard template, wide screen'
          frameWidth={DESKTOP_WIDTH}
          frameHeight={DESKTOP_HEIGHT}
          className='aspect-[16/10]'
        />
      </Safari>
      <motion.div
        style={{ y: leftDrift }}
        className={cn(DRIFTING, 'bottom-0 left-0 hidden w-[18%] sm:block')}
      >
        <div className='-rotate-[8deg]'>
          <Phone
            src={WIDE_TEMPLATE}
            title='Loomboard template, phone'
            label='The Loomboard template on a phone'
          />
        </div>
      </motion.div>
      <motion.div
        style={{ y: rightDrift }}
        className={cn(
          DRIFTING,
          'right-[3%] bottom-[2%] w-[28%] sm:right-0 sm:w-[19%]'
        )}
      >
        <div className='rotate-6'>
          <Phone
            src={SECOND_TEMPLATE}
            title='Analytics template, phone'
            label='The analytics template on a phone'
          />
        </div>
      </motion.div>
    </div>
  );
}
