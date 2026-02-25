'use client';
import { useState } from 'react';
import { TransitionPanel } from '@/components/core/transition-panel';
import { Button } from '@/registry/ndeko/ui/button';
import useMeasure from 'react-use-measure';

const PANEL_WIDTH = 364;

const FEATURES = [
  {
    title: 'Brand',
    description:
      'Develop a distinctive brand identity with tailored logos and guidelines to ensure consistent messaging across all platforms.',
  },
  {
    title: 'Product',
    description:
      'Design and refine products that excel in user experience, meeting needs effectively and creating memorable interactions. We specialize in web applications.',
  },
  {
    title: 'Website',
    description:
      'Create impactful websites that combine beautiful aesthetics with functional design, ensuring a superior online presence.',
  },
  {
    title: 'Design System',
    description:
      'Develop a design system that unifies your brand identity, ensuring consistency across all platforms and products.',
  },
];

const LAST_INDEX = FEATURES.length - 1;

function clampIndex(index: number) {
  if (index < 0) {
    return 0;
  }
  if (index > LAST_INDEX) {
    return LAST_INDEX;
  }
  return index;
}

function directionBetween(fromIndex: number, toIndex: number) {
  if (toIndex > fromIndex) {
    return 1;
  }
  return -1;
}

function enterOffsetOf(direction: number) {
  if (direction > 0) {
    return PANEL_WIDTH;
  }
  return -PANEL_WIDTH;
}

function exitOffsetOf(direction: number) {
  if (direction < 0) {
    return PANEL_WIDTH;
  }
  return -PANEL_WIDTH;
}

function panelHeightOf(measuredHeight: number) {
  if (measuredHeight > 0) {
    return measuredHeight;
  }
  return 'auto';
}

function nextLabelOf(isLast: boolean) {
  if (isLast) {
    return 'Close';
  }
  return 'Next';
}

export function TransitionPanelCard() {
  const [requestedIndex, setRequestedIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [ref, bounds] = useMeasure();
  const activeIndex = clampIndex(requestedIndex);
  const panelHeight = panelHeightOf(bounds.height);
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === LAST_INDEX;
  const nextLabel = nextLabelOf(isLast);

  const handleSetActiveIndex = (newIndex: number) => {
    setDirection(directionBetween(activeIndex, newIndex));
    setRequestedIndex(newIndex);
  };

  const handleNext = () => {
    if (isLast) {
      return;
    }
    handleSetActiveIndex(activeIndex + 1);
  };

  return (
    <div className='hairline-ring ring-border bg-card w-[364px] overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <TransitionPanel
        activeIndex={activeIndex}
        variants={{
          enter: (direction) => ({
            x: enterOffsetOf(direction),
            opacity: 0,
            height: panelHeight,
            position: 'initial',
          }),
          center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            height: panelHeight,
          },
          exit: (direction) => ({
            zIndex: 0,
            x: exitOffsetOf(direction),
            opacity: 0,
            position: 'absolute',
            top: 0,
            width: '100%',
          }),
        }}
        transition={{
          x: { type: 'spring', stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
        }}
        custom={direction}
      >
        {FEATURES.map((feature, index) => (
          <div key={index} className='px-4 pt-4' ref={ref}>
            <h3 className='text-foreground mb-0.5 text-sm font-medium'>
              {feature.title}
            </h3>
            <p className='text-muted-foreground text-[13px]'>
              {feature.description}
            </p>
          </div>
        ))}
      </TransitionPanel>
      <div className='flex justify-between p-4'>
        {!isFirst && (
          <Button
            variant='outline'
            onClick={() => handleSetActiveIndex(activeIndex - 1)}
          >
            Previous
          </Button>
        )}
        {isFirst && <div />}
        <Button variant='outline' onClick={handleNext}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
