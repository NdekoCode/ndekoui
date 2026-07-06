'use client';

import { WordRoll } from '@/components/core/word-roll';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { CheckIcon, LinkIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/registry/ndeko/ui/accordion';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import { anchorOf } from './hash';
import { MarkedText } from './marked-text';
import type { Hit } from './search';

const COPY_LABELS = ['Copy link', 'Link copied'];

function copyLabelOf(isCopied: boolean) {
  if (isCopied) {
    return 'Link copied';
  }
  return 'Copy link';
}

type QuestionRowProps = {
  hit: Hit;
  words: string[];
  isTriggerPressed: boolean;
  isCopyPressed: boolean;
  isCopied: boolean;
  onCopy: (questionId: string) => void;
};

export function QuestionRow({
  hit,
  words,
  isTriggerPressed,
  isCopyPressed,
  isCopied,
  onCopy,
}: QuestionRowProps) {
  const { question } = hit;
  const isSearching = words.length > 0;
  const missesQuestion = !hit.inQuestion;
  const matchesAnswer = hit.inAnswer;
  const isAnswerOnly = isSearching && missesQuestion && matchesAnswer;
  const copyLabel = copyLabelOf(isCopied);

  return (
    <AccordionItem
      value={question.id}
      id={anchorOf(question.id)}
      className='scroll-mt-4'
    >
      <AccordionTrigger
        className={cn('text-sm', pressedQuietOf(isTriggerPressed))}
      >
        <span className='flex min-w-0 flex-col gap-0.5'>
          <span className='text-balance'>
            <MarkedText text={question.question} words={words} />
          </span>
          {isAnswerOnly && (
            <span className='text-muted-foreground text-xs font-normal'>
              Matches in the answer
            </span>
          )}
        </span>
      </AccordionTrigger>
      <AccordionContent className='px-1 text-sm leading-relaxed text-pretty'>
        <p>
          <MarkedText text={question.answer} words={words} />
        </p>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => onCopy(question.id)}
          className={cn(
            'text-muted-foreground mt-3',
            pressedQuietOf(isCopyPressed)
          )}
        >
          <Swap swapKey={String(isCopied)}>
            {isCopied && <CheckIcon />}
            {!isCopied && <LinkIcon />}
          </Swap>
          <WordRoll text={copyLabel} labels={COPY_LABELS} />
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}
