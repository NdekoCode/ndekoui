'use client';

import { Dialog } from '@base-ui/react/dialog';
import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useId, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { PlusIcon, XIcon, type Icon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export type LinearModalPoint = {
  title: string;
  description: string;
  icon?: Icon;
};

export type LinearModalFeature = {
  id: string;
  title: string;
  summary: string;
  description: string;
  image: { src: string; alt: string };
  points?: LinearModalPoint[];
};

type LayoutIds = {
  frame: string;
  image: string;
  title: string;
};

type Transitions = {
  open: Transition;
  close: Transition;
  content: Transition;
};

const MOTION: Transitions = {
  open: { type: 'spring', bounce: 0, duration: 0.36 },
  close: { type: 'spring', bounce: 0, duration: 0.28 },
  content: { duration: 0.2, delay: 0.12, ease: [0.23, 1, 0.32, 1] },
};

const STILL: Transitions = {
  open: { duration: 0 },
  close: { duration: 0 },
  content: { duration: 0.15 },
};

const BACKDROP_IN: Transition = { duration: 0.2 };

const BACKDROP_OUT: Transition = { duration: 0.15 };

const CARD_RADIUS = 14;

const MODAL_RADIUS = 18;

function transitionsOf(prefersReducedMotion: boolean | null) {
  if (prefersReducedMotion) {
    return STILL;
  }
  return MOTION;
}

function layoutIdsOf(scope: string, feature: LinearModalFeature): LayoutIds {
  const prefix = `${scope}-${feature.id}`;
  return {
    frame: `${prefix}-frame`,
    image: `${prefix}-image`,
    title: `${prefix}-title`,
  };
}

const CARD = [
  'group/card flex w-full cursor-pointer flex-col overflow-hidden bg-card text-left text-card-foreground',
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
].join(' ');

/*
 * Shadows go through `style`, not classes: motion corrects a style shadow while the frame scales
 * between card and dialog, where a class shadow or ring would thicken and thin on every frame.
 */
const CARD_SHADOW =
  '0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 1px rgba(0, 0, 0, 0.03)';

const MODAL_SHADOW = '0 24px 48px -16px rgba(0, 0, 0, 0.28)';

const PLUS_TILE = [
  'keycap-3d grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground',
  'transition-colors duration-150 group-hover/card:text-foreground',
].join(' ');

type FeatureCardProps = {
  feature: LinearModalFeature;
  ids: LayoutIds;
  transition: Transition;
  onOpen: (feature: LinearModalFeature, trigger: HTMLButtonElement) => void;
};

function FeatureCard({ feature, ids, transition, onOpen }: FeatureCardProps) {
  function open(event: React.MouseEvent<HTMLButtonElement>) {
    onOpen(feature, event.currentTarget);
  }

  return (
    <motion.button
      type='button'
      aria-haspopup='dialog'
      layoutId={ids.frame}
      layoutCrossfade={false}
      transition={transition}
      onClick={open}
      className={CARD}
      style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
    >
      <motion.img
        layoutId={ids.image}
        layoutCrossfade={false}
        transition={transition}
        src={feature.image.src}
        alt={feature.image.alt}
        className='aspect-video w-full object-cover'
      />
      <span className='flex items-end gap-3 p-4'>
        <span className='flex min-w-0 flex-1 flex-col gap-1'>
          <motion.span
            layoutId={ids.title}
            layoutCrossfade={false}
            transition={transition}
            className='text-foreground w-fit text-sm font-medium'
          >
            {feature.title}
          </motion.span>
          <motion.span
            layout='position'
            transition={transition}
            className='text-muted-foreground text-[13px]'
          >
            {feature.summary}
          </motion.span>
        </span>
        <motion.span
          aria-hidden='true'
          layout='position'
          transition={transition}
          className={PLUS_TILE}
        >
          <PlusIcon className='size-3.5' />
        </motion.span>
      </span>
    </motion.button>
  );
}

function PointRow({ point }: { point: LinearModalPoint }) {
  const PointIcon = point.icon;

  return (
    <li className='flex gap-3'>
      {PointIcon && (
        <span className='keycap-3d text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg'>
          <PointIcon className='size-4' />
        </span>
      )}
      <span className='flex flex-col gap-0.5'>
        <span className='text-foreground text-[13px] font-medium'>
          {point.title}
        </span>
        <span className='text-muted-foreground text-[13px]'>
          {point.description}
        </span>
      </span>
    </li>
  );
}

type FeatureModalProps = {
  feature: LinearModalFeature;
  ids: LayoutIds;
  transitions: Transitions;
  closeLabel: string;
  finalFocus: React.RefObject<HTMLButtonElement | null>;
};

const MODAL = [
  'relative m-auto flex w-full max-w-xl flex-col overflow-hidden bg-card text-card-foreground outline-none',
].join(' ');

function FeatureModal({
  feature,
  ids,
  transitions,
  closeLabel,
  finalFocus,
}: FeatureModalProps) {
  const points = feature.points ?? [];
  const hasPoints = points.length > 0;

  return (
    <Dialog.Portal keepMounted>
      <Dialog.Backdrop
        className='fixed inset-0 z-50 bg-black/40 backdrop-blur-xs'
        render={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: BACKDROP_IN }}
            exit={{ opacity: 0, transition: BACKDROP_OUT }}
          />
        }
      />
      <Dialog.Viewport className='fixed inset-0 z-50 flex overflow-y-auto p-4 sm:p-8'>
        <Dialog.Popup
          finalFocus={finalFocus}
          className={MODAL}
          render={
            <motion.div
              layoutId={ids.frame}
              layoutCrossfade={false}
              transition={transitions.open}
              style={{ borderRadius: MODAL_RADIUS, boxShadow: MODAL_SHADOW }}
            />
          }
        >
          <motion.img
            layoutId={ids.image}
            layoutCrossfade={false}
            transition={transitions.open}
            src={feature.image.src}
            alt={feature.image.alt}
            className='aspect-video w-full object-cover'
          />
          <Dialog.Close
            aria-label={closeLabel}
            render={
              <Button
                variant='outline'
                size='icon-sm'
                className='absolute top-3 right-3'
              />
            }
          >
            <XIcon />
          </Dialog.Close>
          <div className='flex flex-col gap-2 p-6'>
            <Dialog.Title
              className='text-foreground w-fit text-lg font-semibold text-balance'
              render={
                <motion.h2
                  layoutId={ids.title}
                  layoutCrossfade={false}
                  transition={transitions.open}
                />
              }
            >
              {feature.title}
            </Dialog.Title>
            <motion.div
              layout='position'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: transitions.content }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              className='flex flex-col gap-5'
            >
              <Dialog.Description className='text-muted-foreground text-[13px] leading-relaxed'>
                {feature.description}
              </Dialog.Description>
              {hasPoints && (
                <ul className='flex flex-col gap-4'>
                  {points.map((point) => (
                    <PointRow key={point.title} point={point} />
                  ))}
                </ul>
              )}
            </motion.div>
          </div>
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  );
}

export type LinearModalProps = {
  features: LinearModalFeature[];
  className?: string;
  closeLabel?: string;
};

export function LinearModal({
  features,
  className,
  closeLabel = 'Close',
}: LinearModalProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const scope = useId();
  const [active, setActive] = useState<LinearModalFeature | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const transitions = transitionsOf(prefersReducedMotion);
  const isOpen = active !== null;

  function openFeature(
    feature: LinearModalFeature,
    trigger: HTMLButtonElement
  ) {
    triggerRef.current = trigger;
    setActive(feature);
  }

  function changeOpen(open: boolean) {
    if (open) {
      return;
    }
    setActive(null);
  }

  return (
    <>
      <div className={cn('grid gap-3 sm:grid-cols-2', className)}>
        {features.map((feature) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            ids={layoutIdsOf(scope, feature)}
            transition={transitions.close}
            onOpen={openFeature}
          />
        ))}
      </div>
      <Dialog.Root open={isOpen} onOpenChange={changeOpen}>
        <AnimatePresence>
          {active && (
            <FeatureModal
              key={active.id}
              feature={active}
              ids={layoutIdsOf(scope, active)}
              transitions={transitions}
              closeLabel={closeLabel}
              finalFocus={triggerRef}
            />
          )}
        </AnimatePresence>
      </Dialog.Root>
    </>
  );
}
