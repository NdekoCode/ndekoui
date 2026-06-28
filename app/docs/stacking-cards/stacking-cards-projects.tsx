'use client';
import { useRef } from 'react';
import { StackingCard, StackingCards } from '@/components/core/stacking-cards';

const PROJECTS = [
  {
    client: 'Tidewell ferries',
    title: 'Timetables riders read at a glance',
    summary:
      'Every crossing of the day on one screen, with the next boat first and the last one marked before it is too late.',
    year: '2026',
    image: '/images/scenes/scene-05.svg',
  },
  {
    client: 'Brightmoor library',
    title: 'A catalogue search that forgives typos',
    summary:
      'Readers find the book they half remember. Loans went up in the first month, and the desk gets fewer calls.',
    year: '2025',
    image: '/images/scenes/scene-04.svg',
  },
  {
    client: 'Ashgrove clinic',
    title: 'Booking a visit in three taps',
    summary:
      'Patients pick a reason, a day and a doctor. The receptionist sees the morning fill up before the phones ring.',
    year: '2025',
    image: '/images/scenes/scene-02.svg',
  },
  {
    client: 'Fernhill farm shop',
    title: 'Weekly boxes ordered by Thursday',
    summary:
      'Customers swap what they do not want and the farm knows how much to pick on Friday morning.',
    year: '2024',
    image: '/images/scenes/scene-06.svg',
  },
];

export function StackingCardsProjects() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className='relative h-[460px] w-full overflow-y-auto rounded-xl px-4 sm:px-8'
    >
      <div className='flex h-[140px] flex-col justify-end gap-1 pb-2 text-center'>
        <h2 className='text-foreground text-base font-semibold text-balance'>
          Selected work
        </h2>
        <p className='text-muted-foreground text-[13px]'>
          Four projects from the Quillstone studio
        </p>
      </div>
      <StackingCards containerRef={containerRef} frameClassName='h-[460px]'>
        {PROJECTS.map((project) => (
          <StackingCard
            key={project.client}
            className='bg-card hairline-ring ring-border max-w-xl rounded-2xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
          >
            <article className='grid h-[320px] grid-rows-[1fr_auto] sm:h-[280px] sm:grid-cols-2 sm:grid-rows-1'>
              {/* eslint-disable-next-line @next/next/no-img-element -- registry examples land in any React app, where next/image may not exist */}
              <img
                src={project.image}
                alt=''
                width={1200}
                height={800}
                loading='lazy'
                decoding='async'
                className='size-full min-h-0 object-cover'
              />
              <div className='flex flex-col justify-between gap-3 p-5'>
                <div className='flex flex-col gap-1.5'>
                  <span className='text-muted-foreground text-xs'>
                    {project.client}
                  </span>
                  <h3 className='text-foreground text-base font-semibold text-balance'>
                    {project.title}
                  </h3>
                  <p className='text-muted-foreground line-clamp-3 text-[13px] sm:line-clamp-none'>
                    {project.summary}
                  </p>
                </div>
                <span className='text-muted-foreground text-xs tabular-nums'>
                  {project.year}
                </span>
              </div>
            </article>
          </StackingCard>
        ))}
      </StackingCards>
      <div className='text-muted-foreground flex h-[200px] items-center justify-center text-[13px]'>
        More work on request
      </div>
    </div>
  );
}
