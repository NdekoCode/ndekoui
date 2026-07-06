'use client';

import { useEffect, useId, useState } from 'react';

import {
  typingSteps,
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  PRESS_LEAD_MS,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { LifeBuoyIcon } from '@/registry/ndeko/lib/icons';
import { nounOf } from '@/registry/ndeko/lib/words';
import { Accordion } from '@/registry/ndeko/ui/accordion';
import { Button } from '@/registry/ndeko/ui/button';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { ANCHORS, BRAND } from './data';
import { FaqSearch, TopicChips } from './faq-controls';
import {
  DEMO_QUERY,
  DEMO_QUESTION_ID,
  DEMO_TOPIC,
  DEMO_TOPIC_QUESTION_ID,
  SECTION,
} from './faq-data';
import { FaqItem } from './faq-item';
import {
  anchorOf,
  questionIdOfHash,
  questionsOf,
  topicCountsOf,
  wordsOf,
  type TopicFilter,
} from './faq-model';
import { SectionFrame, SectionHeader } from './section-frame';

const COPIED_FOR_MS = 1600;

const LOOP_AFTER_MS = 2600;

function linkOf(questionId: string) {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}#${anchorOf(questionId)}`;
}

function resultsLineOf(count: number) {
  const noun = nounOf(count, 'question');
  return `${count} ${noun} shown`;
}

type NoQuestionProps = {
  query: string;
  onClear: () => void;
};

function NoQuestion({ query, onClear }: NoQuestionProps) {
  return (
    <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col items-start gap-3 rounded-xl p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex flex-col gap-1'>
        <p className='text-sm font-medium text-pretty'>
          No question holds “{query.trim()}”.
        </p>
        <p className='text-muted-foreground text-[13px] text-pretty'>
          Ask a person: replies come from the team, not from an agent.
        </p>
      </div>
      <div className='flex flex-wrap gap-2'>
        <Button
          size='sm'
          nativeButton={false}
          render={<a href={`mailto:${BRAND.email}`} />}
        >
          Write to the team
        </Button>
        <Button size='sm' variant='outline' onClick={onClear}>
          Clear the search
        </Button>
      </div>
    </div>
  );
}

export function Faq() {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<TopicFilter>('all');
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const { pressed, press } = usePress<string>();
  const { schedule } = useTimeouts();
  const searchId = useId();
  const words = wordsOf(query);
  const questions = questionsOf(words, topic);
  const counts = topicCountsOf(words);
  const hasQuestions = questions.length > 0;

  function resetDemonstration() {
    setQuery('');
    setTopic('all');
    setOpenIds([]);
    setCopiedId(null);
  }

  const steps: AutoplayStep[] = [
    ...typingSteps(DEMO_QUERY, setQuery, {
      startAfter: 1500,
      characterMs: 130,
    }),
    { after: 1500, run: () => press(`question-${DEMO_QUESTION_ID}`) },
    { after: PRESS_LEAD_MS, run: () => setOpenIds([DEMO_QUESTION_ID]) },
    { after: 1800, run: () => press(`link-${DEMO_QUESTION_ID}`) },
    { after: PRESS_LEAD_MS, run: () => setCopiedId(DEMO_QUESTION_ID) },
    { after: 1800, run: () => resetDemonstration() },
    { after: 1200, run: () => press(`topic-${DEMO_TOPIC}`) },
    { after: PRESS_LEAD_MS, run: () => setTopic(DEMO_TOPIC) },
    { after: 1000, run: () => setOpenIds([DEMO_TOPIC_QUESTION_ID]) },
    { after: 2400, run: () => setOpenIds([]) },
  ];
  const { ref, isAutoplaying } = useAutoplay<HTMLElement>(steps, {
    loopAfter: LOOP_AFTER_MS,
    onReset: resetDemonstration,
  });
  const spoken = spokenUnless(isAutoplaying, message);

  useKeptHeight(ref);

  useEffect(() => {
    function openFromHash() {
      const questionId = questionIdOfHash(window.location.hash);
      if (questionId === null) {
        return;
      }
      setQuery('');
      setTopic('all');
      setOpenIds([questionId]);
      const target = document.getElementById(anchorOf(questionId));
      target?.scrollIntoView({ block: 'center' });
    }

    const timer = setTimeout(openFromHash, 0);
    window.addEventListener('hashchange', openFromHash);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', openFromHash);
    };
  }, []);

  function search(next: string) {
    setQuery(next);
    const nextWords = wordsOf(next);
    const count = questionsOf(nextWords, topic).length;
    setMessage(resultsLineOf(count));
  }

  function pickTopic(next: TopicFilter) {
    setTopic(next);
    const count = questionsOf(words, next).length;
    setMessage(resultsLineOf(count));
  }

  function clear() {
    search('');
  }

  function changeOpen(value: string[]) {
    setOpenIds(value);
  }

  async function copyLink(questionId: string) {
    try {
      await navigator.clipboard.writeText(linkOf(questionId));
    } catch {
      return;
    }
    setCopiedId(questionId);
    setMessage('Link copied');
    schedule(() => setCopiedId(null), COPIED_FOR_MS);
  }

  return (
    <SectionFrame id={ANCHORS.faq} ref={ref}>
      <SectionHeader
        icon={LifeBuoyIcon}
        label={SECTION.label}
        title={SECTION.title}
        lead={SECTION.lead}
      />
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col gap-3 @2xl:flex-row @2xl:items-center @2xl:justify-between'>
          <TopicChips
            counts={counts}
            topic={topic}
            pressed={pressed}
            onPick={pickTopic}
          />
          <FaqSearch id={searchId} value={query} onChange={search} />
        </div>
        {hasQuestions && (
          <Accordion
            value={openIds}
            onValueChange={changeOpen}
            className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] rounded-xl px-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
          >
            {questions.map((question) => (
              <FaqItem
                key={question.id}
                question={question}
                words={words}
                pressed={pressed}
                isCopied={copiedId === question.id}
                onCopyLink={copyLink}
              />
            ))}
          </Accordion>
        )}
        {!hasQuestions && <NoQuestion query={query} onClear={clear} />}
        <p className='text-muted-foreground text-[13px] text-pretty'>
          {SECTION.contactLine}{' '}
          <a
            href={`mailto:${BRAND.email}`}
            className='text-primary-ink focus-visible:ring-ring/25 rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]'
          >
            {BRAND.email}
          </a>
        </p>
      </div>
      <LiveRegion message={spoken} />
    </SectionFrame>
  );
}
