'use client';

import { useId } from 'react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { ChevronRightIcon, InfoIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/registry/ndeko/ui/breadcrumb';
import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import {
  ARTICLE,
  CONTACT,
  RELATED,
  SECTIONS,
  SITE,
  type ArticleBlock,
} from './data';
import { FeedbackCard } from './feedback-card';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  type FeedbackAction,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const CARD =
  'bg-card hairline-ring ring-border dark:bg-foreground/[0.03] rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

function Block({ block }: { block: ArticleBlock }) {
  if (block.kind === 'steps') {
    return (
      <ol className='flex flex-col gap-3'>
        {block.items.map((item, index) => (
          <li key={item} className='flex items-start gap-3'>
            <span className='keycap-3d text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-medium tabular-nums'>
              {index + 1}
            </span>
            <span className='pt-0.5 text-[15px] leading-6 text-pretty'>
              {item}
            </span>
          </li>
        ))}
      </ol>
    );
  }
  if (block.kind === 'note') {
    return (
      <p className='bg-info/10 flex items-start gap-3 rounded-xl px-4 py-3 text-[13px] leading-5'>
        <InfoIcon className='text-info-foreground mt-px size-4 shrink-0' />
        <span>
          {block.text}{' '}
          <a
            href={block.href}
            className={cn(
              'text-primary-ink rounded-sm font-medium underline-offset-4 hover:underline',
              FOCUS_RING
            )}
          >
            {block.linkLabel}
          </a>
        </span>
      </p>
    );
  }
  return <p className='text-[15px] leading-7 text-pretty'>{block.text}</p>;
}

export default function HelpCenter02() {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const relatedId = useId();
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;
  useKeptHeight(ref);

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  /** The controls a person used leave with the question, so the focus follows to what replaced them. */
  function actAndFollow(action: FeedbackAction, selector: string) {
    act(action);
    focusLater(selector);
  }

  function answer(choice: 'yes' | 'no') {
    if (choice === 'no') {
      actAndFollow({ type: 'answered', answer: 'no' }, '[data-reason]');
      return;
    }
    actAndFollow({ type: 'answered', answer: 'yes' }, '[data-thanks]');
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full'
      >
        <div className='mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 @2xl:px-8 @2xl:py-8'>
          <header className='flex min-h-8 items-center gap-2'>
            <a
              href={SITE.homeHref}
              className={cn(
                'flex items-center gap-2 rounded-md text-sm font-semibold',
                FOCUS_RING
              )}
            >
              <CompanyMark seed={SITE.name} size='lg' />
              {SITE.name}
            </a>
            <span className='text-muted-foreground text-sm'>Help</span>
            <span className='flex-1' />
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay'
            />
          </header>

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={SITE.helpHref}>
                  Help center
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={SITE.topicHref}>
                  {ARTICLE.topic}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className='min-w-0'>
                <BreadcrumbPage className='truncate'>
                  {ARTICLE.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className='grid gap-10 @3xl:grid-cols-[minmax(0,1fr)_18rem] @3xl:gap-12'>
            <div className='flex min-w-0 flex-col gap-10'>
              <article className='flex flex-col gap-8'>
                <header className='flex flex-col gap-3'>
                  <h1 className='text-2xl font-semibold text-balance @sm:text-3xl'>
                    {ARTICLE.title}
                  </h1>
                  <p className='text-muted-foreground text-xs tabular-nums'>
                    {ARTICLE.updated} · {ARTICLE.minutes} min read
                  </p>
                  <p className='text-muted-foreground text-base leading-7 text-pretty'>
                    {ARTICLE.lead}
                  </p>
                </header>
                {SECTIONS.map((section) => (
                  <section key={section.id} className='flex flex-col gap-4'>
                    <h2 className='text-lg font-semibold text-balance'>
                      {section.title}
                    </h2>
                    {section.blocks.map((block, index) => (
                      <Block key={`${section.id}-${index}`} block={block} />
                    ))}
                  </section>
                ))}
              </article>

              <FeedbackCard
                state={state}
                pressed={pressed}
                onAnswer={answer}
                onType={(value) => act({ type: 'typed', value })}
                onSend={() => actAndFollow({ type: 'sent' }, '[data-thanks]')}
                onSkip={() =>
                  actAndFollow({ type: 'skipped' }, '[data-thanks]')
                }
                onChange={() =>
                  actAndFollow({ type: 'changed' }, '[data-answer-yes]')
                }
              />
            </div>

            <aside className='flex flex-col gap-8'>
              <section
                aria-labelledby={relatedId}
                className='flex flex-col gap-2'
              >
                <h2 id={relatedId} className='px-1 text-[13px] font-medium'>
                  Related articles
                </h2>
                <ul className='flex flex-col'>
                  {RELATED.map((related) => (
                    <li key={related.id}>
                      <a
                        href={related.href}
                        className={cn(
                          'group hover:bg-foreground/[0.03] flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors duration-100',
                          FOCUS_RING
                        )}
                      >
                        <span className='min-w-0 flex-1 text-pretty'>
                          {related.title}
                        </span>
                        <ChevronRightIcon className='text-muted-foreground size-4 shrink-0 transition-transform duration-100 group-hover:translate-x-0.5' />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>

              <section
                aria-label='Contact support'
                className={cn(CARD, 'flex flex-col gap-4 p-5')}
              >
                <div className='flex items-center gap-3'>
                  <Avatar seed={CONTACT.person} className='size-9' />
                  <div className='flex min-w-0 flex-col'>
                    <p className='text-[13px] font-medium'>Still stuck?</p>
                    <p className='text-muted-foreground text-xs'>
                      {CONTACT.person}, {CONTACT.role}
                    </p>
                  </div>
                </div>
                <p className='text-muted-foreground text-[13px] text-pretty'>
                  {CONTACT.lead}
                </p>
                <div className='flex flex-wrap gap-2'>
                  <Button
                    size='sm'
                    nativeButton={false}
                    render={<a href={CONTACT.chatHref} />}
                  >
                    Start a chat
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    nativeButton={false}
                    render={<a href={CONTACT.emailHref} />}
                  >
                    Email us
                  </Button>
                </div>
              </section>
            </aside>
          </div>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
