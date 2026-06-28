'use client';
import {
  type ComponentProps,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

// A one percent band across the middle of the scrolling area: the step that crosses it is active.
const MIDDLE_BAND = '-50% 0px -49% 0px';

export type StickyScrollStep = {
  id: string;
  title: ReactNode;
  description: ReactNode;
  media: ReactNode;
};

export type StickyScrollProps = {
  steps: StickyScrollStep[];
  containerRef?: RefObject<HTMLElement | null>;
  mediaSide?: 'start' | 'end';
  className?: string;
  frameClassName?: string;
  stepClassName?: string;
};

function stateOf(isActive: boolean) {
  if (isActive) {
    return 'active';
  }
  return 'inactive';
}

function panelOrderOf(mediaSide: 'start' | 'end') {
  if (mediaSide === 'start') {
    return '@xl:order-first';
  }
  return '';
}

function useActiveStep(
  listRef: RefObject<HTMLOListElement | null>,
  containerRef: RefObject<HTMLElement | null> | undefined,
  stepCount: number
) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    const root = containerRef?.current ?? null;
    const activateCrossingStep = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }
        const indexAttribute = entry.target.getAttribute('data-step-index');
        const index = Number(indexAttribute);
        setActiveIndex(index);
      }
    };
    const observer = new IntersectionObserver(activateCrossingStep, {
      root,
      rootMargin: MIDDLE_BAND,
    });

    for (const step of Array.from(list.children)) {
      observer.observe(step);
    }
    return () => observer.disconnect();
  }, [listRef, containerRef, stepCount]);

  return activeIndex;
}

export function StickyScroll({
  steps,
  containerRef,
  mediaSide = 'end',
  className,
  frameClassName,
  stepClassName,
}: StickyScrollProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const activeIndex = useActiveStep(listRef, containerRef, steps.length);
  const panelOrder = panelOrderOf(mediaSide);

  return (
    <div className={cn('@container', className)}>
      <div className='grid gap-x-12 @xl:grid-cols-2'>
        <ol ref={listRef} className='flex flex-col'>
          {steps.map((step, index) => {
            const isActive = index === activeIndex;

            return (
              <li
                key={step.id}
                data-step-index={index}
                data-state={stateOf(isActive)}
                className={cn(
                  'group/step flex min-h-[70svh] flex-col justify-center gap-4 py-10',
                  stepClassName
                )}
              >
                <div className='@xl:hidden'>{step.media}</div>
                <div className='flex flex-col gap-2'>
                  <h3 className='text-muted-foreground group-data-[state=active]/step:text-foreground text-lg font-semibold text-balance transition-colors duration-200'>
                    {step.title}
                  </h3>
                  <div className='text-muted-foreground text-sm'>
                    {step.description}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <div
          aria-hidden='true'
          className={cn(
            'sticky top-0 hidden h-svh items-center self-start @xl:flex',
            panelOrder,
            frameClassName
          )}
        >
          <div className='grid w-full'>
            {steps.map((step, index) => {
              const isActive = index === activeIndex;

              // The outgoing media stays opaque under the incoming one until its fade ends,
              // so the panel never shows the page through a half-faded pair.
              return (
                <div
                  key={step.id}
                  data-state={stateOf(isActive)}
                  className='col-start-1 row-start-1 opacity-0 transition-opacity delay-200 duration-0 data-[state=active]:z-10 data-[state=active]:opacity-100 data-[state=active]:delay-0 data-[state=active]:duration-200 data-[state=active]:ease-(--ease-out-strong)'
                >
                  {step.media}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StickySections({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('relative', className)} {...props} />;
}

export function StickySection({
  className,
  ...props
}: ComponentProps<'section'>) {
  return (
    <section
      className={cn('sticky top-0 flex h-svh flex-col', className)}
      {...props}
    />
  );
}
