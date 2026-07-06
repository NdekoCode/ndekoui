'use client';

import { useInView } from 'motion/react';
import { useRef, useState } from 'react';

import { Globe, type GlobeMarker } from '@/components/core/globe';
import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { Settle, SettleItem } from '@/registry/ndeko/ui/settle';

import { PROJECTS, PROJECTS_SECTION, WORK_ANCHOR } from './data';
import { ProjectCard } from './project-card';

const TURN_MS = 3400;

const MARKERS: GlobeMarker[] = PROJECTS.map((project) => ({
  location: project.location,
  label: project.city,
}));

const FIRST_PROJECT = PROJECTS[0];

export function Projects() {
  const [activeId, setActiveId] = useState(FIRST_PROJECT.id);
  const [isPointed, setIsPointed] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const isShown = useInView(gridRef, { once: true, amount: 0.15 });
  const steps = PROJECTS.slice(1).map((project) => ({
    after: TURN_MS,
    run: () => setActiveId(project.id),
  }));
  const { ref } = useAutoplay(steps, {
    loopAfter: TURN_MS,
    onReset: () => setActiveId(FIRST_PROJECT.id),
    isEnabled: !isPointed,
  });
  const activeProject =
    PROJECTS.find((project) => project.id === activeId) ?? FIRST_PROJECT;

  return (
    <section id={WORK_ANCHOR} className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
      <div ref={ref} className='mx-auto flex max-w-6xl flex-col gap-10'>
        <div className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {PROJECTS_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {PROJECTS_SECTION.description}
          </p>
        </div>
        <div className='grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14'>
          <div
            ref={gridRef}
            onPointerEnter={() => setIsPointed(true)}
            onPointerLeave={() => setIsPointed(false)}
            className='order-last lg:order-first'
          >
            <Settle isShown={isShown} className='grid gap-3 sm:grid-cols-2'>
              {PROJECTS.map((project) => (
                <SettleItem key={project.id}>
                  <ProjectCard
                    project={project}
                    isActive={project.id === activeId}
                    onPoint={() => setActiveId(project.id)}
                  />
                </SettleItem>
              ))}
            </Settle>
          </div>
          <div className='mx-auto w-full max-w-[18rem] sm:max-w-[24rem] lg:sticky lg:top-8'>
            <Globe
              markers={MARKERS}
              focus={activeProject.location}
              autoRotate={false}
              label={`A globe turned to ${activeProject.city}`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
