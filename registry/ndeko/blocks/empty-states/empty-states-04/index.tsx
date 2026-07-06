'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  PRESS_LEAD_MS,
  pressedQuietOf,
  pressedSolidOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import {
  ArchiveIcon,
  BotIcon,
  PlayIcon,
  PlusIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { FIRST_SCENE, SCENES, type SceneCopy, type SceneId } from './data';
import { SceneArt } from './scenes';

const THUMB =
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15';

const CROSSFADE_TRANSITION: Transition = {
  duration: 0.22,
  ease: [0.23, 1, 0.32, 1],
};

const CROSSFADE_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const ACTION_ICONS: Record<SceneId, React.ReactNode> = {
  runs: <PlayIcon />,
  inbox: <ArchiveIcon />,
  tools: <PlusIcon />,
  agents: <BotIcon />,
};

const LOOK_MS = 2400;

const BUSY_MS = 700;

const DONE_MS = 2000;

const REST_MS = 2800;

const RESET_AFTER_MS = 3200;

function crossfadeVariantsOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return CROSSFADE_VARIANTS;
}

function sceneOf(value: unknown) {
  return SCENES.find((candidate) => candidate.id === value);
}

function labelsOf(scene: SceneCopy): Record<MorphState, string> {
  return { idle: scene.idle, busy: scene.busy, done: scene.done };
}

export default function EmptyStates04() {
  const [sceneId, setSceneId] = useState<SceneId>(FIRST_SCENE);
  const [actionState, setActionState] = useState<MorphState>('idle');
  const [message, setMessage] = useState('');
  const { pressed, press } = usePress<string>();
  const { schedule, clearAll } = useTimeouts();
  const shouldReduceMotion = usePrefersReducedMotion();
  const isVisible = useDocumentVisible();
  const found = SCENES.find((candidate) => candidate.id === sceneId);
  const scene = found ?? SCENES[0];
  const variants = crossfadeVariantsOf(shouldReduceMotion);
  const pressedValues = [sceneId];

  function showScene(id: SceneId) {
    clearAll();
    setActionState('idle');
    setSceneId(id);
  }

  function runAction() {
    setActionState('busy');
    schedule(() => setActionState('done'), BUSY_MS);
    schedule(() => setActionState('idle'), DONE_MS);
  }

  function sequenceOf(index: number) {
    const sequence = [
      { after: LOOK_MS, run: () => press('action') },
      { after: PRESS_LEAD_MS, run: runAction },
    ];
    const next = SCENES[index + 1];
    if (next) {
      sequence.push(
        { after: REST_MS, run: () => press(`scene-${next.id}`) },
        { after: PRESS_LEAD_MS, run: () => showScene(next.id) }
      );
    }
    return sequence;
  }

  const steps = SCENES.flatMap((_, index) => sequenceOf(index));
  const { ref, isInView, isAutoplaying } = useAutoplay<HTMLDivElement>(steps, {
    loopAfter: RESET_AFTER_MS,
    onReset: () => showScene(FIRST_SCENE),
  });
  const isPlaying = isInView && isVisible;
  const spoken = spokenUnless(isAutoplaying, message);

  function pickScene(nextValues: unknown[]) {
    const [next] = nextValues;
    const picked = sceneOf(next);
    if (!picked) {
      return;
    }
    showScene(picked.id);
    setMessage(picked.title);
  }

  return (
    <div ref={ref} className='@container px-4 py-16 @2xl:px-6 @2xl:py-24'>
      <div className='mx-auto flex max-w-3xl flex-col items-center gap-8'>
        <div className='relative max-w-full overflow-x-auto'>
          <ToggleGroup
            aria-label='Empty states'
            value={pressedValues}
            onValueChange={pickScene}
            travel
            size='sm'
            indicatorClassName={THUMB}
            className='bg-foreground/[0.05] rounded-lg p-0.5'
          >
            {SCENES.map((item) => (
              <ToggleGroupItem
                key={item.id}
                value={item.id}
                className={cn(
                  'h-7 rounded-md px-2.5 text-xs',
                  pressedQuietOf(pressed === `scene-${item.id}`)
                )}
              >
                {item.tab}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] w-full rounded-2xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
          <div className='bg-foreground/[0.04] relative grid min-h-[26rem] place-items-center rounded-[calc(var(--radius-2xl)-0.5rem)] p-6 @2xl:p-10'>
            <AnimatePresence mode='popLayout' initial={false}>
              <motion.div
                key={scene.id}
                variants={variants}
                initial='enter'
                animate='visible'
                exit='exit'
                transition={CROSSFADE_TRANSITION}
                className='flex w-full flex-col items-center gap-6 text-center'
              >
                <SceneArt sceneId={scene.id} isPlaying={isPlaying} />
                <div className='flex max-w-sm flex-col gap-1.5'>
                  <h3 className='text-base font-semibold text-balance'>
                    {scene.title}
                  </h3>
                  <p className='text-muted-foreground text-[13px] text-pretty'>
                    {scene.description}
                  </p>
                </div>
                <MorphButton
                  type='button'
                  state={actionState}
                  labels={labelsOf(scene)}
                  idleIcon={ACTION_ICONS[scene.id]}
                  onClick={runAction}
                  className={cn(pressedSolidOf(pressed === 'action'))}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <LiveRegion message={spoken} />
    </div>
  );
}
