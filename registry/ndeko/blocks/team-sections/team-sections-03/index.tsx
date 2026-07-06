'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useId, useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { PRESS_LEAD_MS, usePress } from '@/registry/ndeko/lib/demonstration';
import { UsersIcon } from '@/registry/ndeko/lib/icons';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Wash } from '@/registry/ndeko/ui/wash';

import { MEMBERS, SECTION } from './data';
import { MemberProfile } from './member-profile';
import { PeoplePicker, tabIdOf } from './people-picker';

const PICK_MS = 3800;

const ENTER: Transition = { duration: 0.4, ease: EASE_OUT_STRONG };

const EXIT: Transition = { duration: 0.18, ease: EASE_OUT_STRONG };

const PROFILE_VARIANTS: Variants = {
  enter: { opacity: 0, y: 6, filter: 'blur(4px)' },
  shown: { opacity: 1, y: 0, filter: 'blur(0px)', transition: ENTER },
  gone: { opacity: 0, filter: 'blur(4px)', transition: EXIT },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  shown: { opacity: 1, transition: ENTER },
  gone: { opacity: 0, transition: EXIT },
};

function variantsOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return PROFILE_VARIANTS;
}

function indexAfter(index: number) {
  const next = index + 1;
  return next % MEMBERS.length;
}

/** The next person after each one, so a round ends on the first person and the loop shows no seam. */
const ROTATION = MEMBERS.map((_, index) => indexAfter(index));

function spokenMemberOf(index: number) {
  const member = MEMBERS[index];
  return `Showing ${member.name}, ${member.role} in ${member.location}`;
}

export default function TeamSections03() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [message, setMessage] = useState('');
  const { pressed, press } = usePress<string>();
  const idBase = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const activeMember = MEMBERS[activeIndex];
  const panelId = `${idBase}-panel`;
  const activeTabId = tabIdOf(idBase, activeMember.id);
  const variants = variantsOf(shouldReduceMotion);

  const steps = ROTATION.flatMap((index) => [
    { after: PICK_MS, run: () => press(MEMBERS[index].id) },
    { after: PRESS_LEAD_MS, run: () => setActiveIndex(index) },
  ]);
  const { ref } = useAutoplay<HTMLElement>(steps, { loopAfter: 0 });

  function pick(memberId: string) {
    const index = MEMBERS.findIndex((member) => member.id === memberId);
    setActiveIndex(index);
    setMessage(spokenMemberOf(index));
  }

  return (
    <section ref={ref} className='@container'>
      <div className='mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 @2xl:px-6 @2xl:py-24 @5xl:px-8'>
        <header className='flex max-w-2xl flex-col gap-3'>
          <p className='text-primary-ink flex items-center gap-1.5 text-[13px] font-medium'>
            <UsersIcon className='size-4' />
            {SECTION.label}
          </p>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {SECTION.lead}
          </p>
        </header>
        <div className='flex flex-col gap-4'>
          <PeoplePicker
            members={MEMBERS}
            activeId={activeMember.id}
            pressedId={pressed}
            tabIdBase={idBase}
            panelId={panelId}
            onPick={pick}
          />
          <div
            id={panelId}
            role='tabpanel'
            aria-labelledby={activeTabId}
            className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] relative isolate rounded-2xl p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @2xl:p-8'
          >
            <Wash />
            <div className='grid *:col-start-1 *:row-start-1'>
              {MEMBERS.map((member) => (
                <div
                  key={member.id}
                  aria-hidden='true'
                  inert
                  className='invisible'
                >
                  <MemberProfile member={member} />
                </div>
              ))}
              <AnimatePresence initial={false}>
                <motion.div
                  key={activeMember.id}
                  variants={variants}
                  initial='enter'
                  animate='shown'
                  exit='gone'
                >
                  <MemberProfile member={activeMember} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <LiveRegion message={message} />
    </section>
  );
}
