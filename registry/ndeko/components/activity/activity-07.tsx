'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

import { PersonAvatar } from './_parts/glyphs';
import { Swap } from './_parts/motion-parts';
import { actorNameOf, personOf } from './_parts/people';
import { relativeTimeOf } from './_parts/time';

type Segment = {
  text: string;
  isMention?: boolean;
};

type QuotedEvent = {
  id: string;
  actorId: string;
  at: string;
  action: string;
  taskKey: string;
  quote: Segment[];
};

const EVENTS: QuotedEvent[] = [
  {
    id: 'q1',
    actorId: 'sana',
    at: '2026-11-05T10:46:00',
    action: 'mentioned you in a comment on',
    taskKey: 'MOS-217',
    quote: [
      { text: '@Amara', isMention: true },
      {
        text: ' the quarterly report filters now keep their values when you switch between teams. The saved views still forget the date range though, so I left that part for a follow-up task. Could you check whether finance needs the range saved before Friday, or whether the follow-up can wait for the next cycle?',
      },
    ],
  },
  {
    id: 'q2',
    actorId: 'leo',
    at: '2026-11-05T09:58:00',
    action: 'replied to your comment on',
    taskKey: 'MOS-214',
    quote: [
      {
        text: 'Agreed, the totals row goes last. I will ship the column picker today and keep the totals for tomorrow morning.',
      },
    ],
  },
  {
    id: 'q3',
    actorId: 'tomas',
    at: '2026-11-04T16:12:00',
    action: 'mentioned you in a comment on',
    taskKey: 'MOS-209',
    quote: [
      { text: 'The refund copy reads well. ' },
      { text: '@Amara', isMention: true },
      {
        text: ', can the second paragraph lose the legal wording? Support says people stop reading there, and the same terms already sit behind the link at the foot of the page, so nothing is lost if we cut it.',
      },
    ],
  },
];

function QuoteText({
  segments,
  isOpen,
  textId,
  onClampChange,
}: {
  segments: Segment[];
  isOpen: boolean;
  textId: string;
  onClampChange: (isClamped: boolean) => void;
}) {
  const textRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const node = textRef.current;
    if (!node) {
      return;
    }
    if (isOpen) {
      return;
    }
    const observer = new ResizeObserver(() => {
      const overflows = node.scrollHeight > node.clientHeight + 1;
      onClampChange(overflows);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [isOpen, onClampChange]);

  return (
    <p
      ref={textRef}
      id={textId}
      className={cn(
        'text-[13px] leading-5 [overflow-wrap:anywhere]',
        !isOpen && 'line-clamp-2'
      )}
    >
      {segments.map((segment, index) => {
        const key = `${index}-${segment.text}`;
        if (segment.isMention) {
          return (
            <span
              key={key}
              className='bg-primary/10 text-primary-ink dark:bg-primary/20 rounded-[4px] px-0.5 font-medium'
            >
              {segment.text}
            </span>
          );
        }
        return <span key={key}>{segment.text}</span>;
      })}
    </p>
  );
}

function toggleLabelOf(isOpen: boolean) {
  if (isOpen) {
    return 'Show less';
  }
  return 'Show more';
}

function QuotedEntry({ event }: { event: QuotedEvent }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textId = useId();
  const showsToggle = isClamped || isOpen;
  const label = toggleLabelOf(isOpen);

  return (
    <li className='flex gap-3 py-2.5'>
      <PersonAvatar
        person={personOf(event.actorId)}
        className='size-7 text-[10px]'
      />
      <div className='min-w-0 flex-1'>
        <div className='flex items-start justify-between gap-3'>
          <p className='text-muted-foreground min-w-0 text-[13px] leading-5'>
            <span className='text-foreground font-medium'>
              {actorNameOf(event.actorId)}
            </span>{' '}
            {event.action}{' '}
            <span className='text-foreground tabular-nums'>
              {event.taskKey}
            </span>
          </p>
          <time
            dateTime={event.at}
            className='text-muted-foreground shrink-0 pt-0.5 text-xs tabular-nums'
          >
            {relativeTimeOf(event.at)}
          </time>
        </div>
        <blockquote className='bg-foreground/[0.03] mt-1.5 rounded-lg px-3 py-2'>
          <AnimatedSize>
            <QuoteText
              segments={event.quote}
              isOpen={isOpen}
              textId={textId}
              onClampChange={setIsClamped}
            />
          </AnimatedSize>
          {showsToggle && (
            <button
              type='button'
              aria-expanded={isOpen}
              aria-controls={textId}
              onClick={() => setIsOpen((current) => !current)}
              className='text-primary-ink focus-visible:ring-ring/25 mt-1 cursor-pointer rounded-sm text-xs font-medium outline-none hover:underline focus-visible:ring-[3px]'
            >
              <AnimatedSize as='span' axis='width'>
                <Swap swapKey={label}>{label}</Swap>
              </AnimatedSize>
            </button>
          )}
        </blockquote>
      </div>
    </li>
  );
}

export default function Activity07() {
  return (
    <section aria-label='Mentions and replies' className='w-full max-w-md'>
      <h3 className='text-sm font-medium'>Mentions and replies</h3>
      <ul className='mt-1'>
        {EVENTS.map((event) => (
          <QuotedEntry key={event.id} event={event} />
        ))}
      </ul>
    </section>
  );
}
