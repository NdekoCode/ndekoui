'use client';

import { cn } from '@/registry/ndeko/lib/utils';
import { CallStatusMark } from '@/registry/ndeko/ui/call-status';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';

import { ARTICLES, stepOf, type Article, type CopilotStep } from './data';
import type { StepRun } from './session';

function sublineOf(step: CopilotStep, run: StepRun) {
  if (run.status === 'done') {
    return step.doneSummary;
  }
  return step.detail;
}

/** A row rises in while the copilot is at that step. Coming back to the ticket shows what is already there, still. */
function arrivalOf(isArriving: boolean) {
  if (isArriving) {
    return 'transition-[opacity,translate] duration-300 ease-(--ease-out-strong) starting:translate-y-1 starting:opacity-0';
  }
  return undefined;
}

type ArticleRowProps = {
  article: Article;
  isArriving: boolean;
};

function ArticleRow({ article, isArriving }: ArticleRowProps) {
  return (
    <li
      className={cn(
        'bg-foreground/[0.04] flex items-start gap-2 rounded-md px-2 py-1.5 text-xs',
        arrivalOf(isArriving)
      )}
    >
      <span className='keycap-3d text-muted-foreground mt-px inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-[4px] px-1 text-[10px] leading-none font-medium tabular-nums'>
        {article.number}
      </span>
      <span className='flex min-w-0 flex-col'>
        <span className='truncate font-medium'>{article.title}</span>
        <span className='text-muted-foreground leading-4'>
          {article.excerpt}
        </span>
      </span>
    </li>
  );
}

type StepRowProps = {
  run: StepRun;
  isLast: boolean;
  articlesFound: number;
};

function StepRow({ run, isLast, articlesFound }: StepRowProps) {
  const step = stepOf(run.id);
  const isRunning = run.status === 'running';
  const articles = ARTICLES.slice(0, articlesFound);
  const showsArticles = run.id === 'search' && articles.length > 0;

  return (
    <li
      className={cn(
        'relative flex gap-2.5 pb-3 last:pb-0',
        arrivalOf(isRunning)
      )}
    >
      {!isLast && (
        <span
          aria-hidden='true'
          className='bg-border absolute start-2 top-6 bottom-1 w-px'
        />
      )}
      <span className='flex h-5 shrink-0 items-center'>
        <CallStatusMark status={run.status} />
      </span>
      <div className='flex min-w-0 flex-1 flex-col'>
        <p className='flex h-5 items-center gap-2 text-[13px]'>
          <span className='min-w-0 flex-1 truncate font-medium'>
            {step.title}
          </span>
          <LiveDuration
            item={run}
            isRunning={isRunning}
            className='text-muted-foreground w-10 shrink-0 text-end text-xs'
          />
        </p>
        <p
          key={run.status}
          className='text-muted-foreground text-xs leading-5 transition-opacity duration-300 starting:opacity-0'
        >
          {sublineOf(step, run)}
        </p>
        {showsArticles && (
          <ul aria-label='Articles found' className='flex flex-col gap-1 pt-1'>
            {articles.map((article) => (
              <ArticleRow
                key={article.number}
                article={article}
                isArriving={isRunning}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

type CopilotStepsProps = {
  steps: StepRun[];
  articlesFound: number;
};

/** Rows arrive at the end of the list, where nothing sits under them, so a fade is enough and nothing is resized by script. */
export function CopilotSteps({ steps, articlesFound }: CopilotStepsProps) {
  const lastIndex = steps.length - 1;

  return (
    <ol aria-label='What the copilot did' className='flex flex-col'>
      {steps.map((run, index) => (
        <StepRow
          key={run.id}
          run={run}
          isLast={index === lastIndex}
          articlesFound={articlesFound}
        />
      ))}
    </ol>
  );
}
