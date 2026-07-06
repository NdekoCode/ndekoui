'use client';

import { useEffect, useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf, nounOf } from '@/registry/ndeko/lib/words';
import { Accordion } from '@/registry/ndeko/ui/accordion';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { AskPerson } from './ask-person';
import { Collapse } from './collapse';
import { PERSON, QUESTIONS, SECTION, TOPICS, type Question } from './data';
import { anchorOf, linkOf, useLinkedQuestion } from './hash';
import { QuestionRow } from './question-row';
import { SearchField } from './search-field';
import { hitsOf, inTopic, topicCountsOf, wordsOf } from './search';
import {
  COPIED_MS,
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
} from './session';
import { TopicChips } from './topic-chips';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const QUESTION_WORDS = ['question', 'questions'];

function scrollBehaviorOf(shouldReduceMotion: boolean): ScrollBehavior {
  if (shouldReduceMotion) {
    return 'auto';
  }
  return 'smooth';
}

function spokenLineOf(
  copiedId: string | null,
  shown: number,
  isEmpty: boolean
) {
  if (copiedId !== null) {
    return 'Link copied';
  }
  if (isEmpty) {
    return `No question matches. ${PERSON.firstName} can answer by email.`;
  }
  return `${countOf(shown, 'question')} shown`;
}

function dividerOf(isFirstShown: boolean) {
  if (isFirstShown) {
    return undefined;
  }
  return 'hairline-t border-border';
}

function idsOf(value: unknown[]) {
  return value.filter((item): item is string => typeof item === 'string');
}

export default function Faqs03() {
  const {
    ref,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
    takeOver,
  } = useSession(SESSION);
  const shouldReduceMotion = usePrefersReducedMotion();
  const listId = useId();
  const linkedFromAddress = useLinkedQuestion();
  const words = wordsOf(state.query);
  const hits = hitsOf(state.query);
  const counts = topicCountsOf(hits);
  const visible = inTopic(hits, state.topic);
  const shownIds = visible.map((hit) => hit.question.id);
  const firstShownId = shownIds[0];
  const isEmpty = visible.length === 0;
  const isInOtherTopics = isEmpty && hits.length > 0;
  const topic = TOPICS.find((candidate) => candidate.id === state.topic);
  const topicLabel = topic?.label ?? 'this topic';
  const shownLine = spokenLineOf(state.copiedId, visible.length, isEmpty);
  const message = spokenUnless(isAutoplaying, shownLine);
  const canReplay = isFinished && !isAutoplaying;
  const copiedId = state.copiedId;
  const linkedId = state.linkedId;

  useKeptHeight(ref);

  useEffect(() => {
    if (linkedFromAddress === null) {
      return;
    }
    takeOver();
    act({ type: 'linked', id: linkedFromAddress });
  }, [linkedFromAddress, takeOver, act]);

  useEffect(() => {
    if (linkedId === null) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      const selector = `[id="${anchorOf(linkedId)}"]`;
      const row = ref.current?.querySelector<HTMLElement>(selector);
      const behavior = scrollBehaviorOf(shouldReduceMotion);
      row?.scrollIntoView({ block: 'nearest', behavior });
    });
    return () => cancelAnimationFrame(frame);
  }, [linkedId, shouldReduceMotion, ref]);

  useEffect(() => {
    if (copiedId === null) {
      return;
    }
    const timer = setTimeout(() => act({ type: 'copyCleared' }), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copiedId, act]);

  async function copyLink(questionId: string) {
    try {
      await navigator.clipboard.writeText(linkOf(questionId));
    } catch {
      return;
    }
    act({ type: 'copied', id: questionId });
  }

  function hitOf(question: Question) {
    const found = visible.find((hit) => hit.question.id === question.id);
    return found ?? { question, inQuestion: false, inAnswer: false };
  }

  function changeOpen(value: unknown[]) {
    act({ type: 'opened', ids: idsOf(value) });
  }

  return (
    <div ref={ref} className='@container min-h-[58rem]'>
      <section className='px-4 py-16 @2xl:px-6 @2xl:py-24 @5xl:px-8'>
        <div className='mx-auto flex max-w-3xl flex-col gap-8'>
          <header className='flex flex-col gap-3'>
            <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
              {SECTION.title}
            </h2>
            <p className='text-muted-foreground max-w-xl text-base text-pretty'>
              {SECTION.description}
            </p>
          </header>
          <div className='flex flex-col gap-3'>
            <SearchField
              query={state.query}
              listId={listId}
              isClearPressed={pressed === 'clear'}
              onType={(value) => act({ type: 'typed', value })}
              onClear={() => act({ type: 'cleared' })}
            />
            <TopicChips
              topic={state.topic}
              counts={counts}
              pressed={pressed}
              onPick={(next) => act({ type: 'topicPicked', topic: next })}
            />
          </div>
          <div id={listId} className='flex flex-col gap-4'>
            <Accordion value={state.openIds} onValueChange={changeOpen}>
              {QUESTIONS.map((question) => (
                <Collapse
                  key={question.id}
                  isShown={shownIds.includes(question.id)}
                >
                  <div
                    className={cn(
                      'px-[3px] py-[3px]',
                      dividerOf(firstShownId === question.id)
                    )}
                  >
                    <QuestionRow
                      hit={hitOf(question)}
                      words={words}
                      isTriggerPressed={pressed === `trigger-${question.id}`}
                      isCopyPressed={pressed === `copy-${question.id}`}
                      isCopied={copiedId === question.id}
                      onCopy={copyLink}
                    />
                  </div>
                </Collapse>
              ))}
            </Accordion>
            <Collapse isShown={isEmpty}>
              <div className='p-[3px]'>
                <AskPerson
                  query={state.query}
                  topicLabel={topicLabel}
                  isInOtherTopics={isInOtherTopics}
                  isClearPressed={pressed === 'clear-search'}
                  onClear={() => act({ type: 'cleared' })}
                  onAllTopics={() => act({ type: 'topicPicked', topic: 'all' })}
                />
              </div>
            </Collapse>
            <div className='flex min-h-8 items-center justify-between gap-3'>
              <p className='text-muted-foreground flex items-baseline gap-1 text-xs tabular-nums'>
                <MotionNumber value={visible.length} />
                <WordRoll
                  text={nounOf(visible.length, 'question')}
                  labels={QUESTION_WORDS}
                />
              </p>
              <ReplayButton
                isShown={canReplay}
                onReplay={restart}
                label='Replay'
              />
            </div>
          </div>
        </div>
      </section>
      <LiveRegion message={message} />
    </div>
  );
}
