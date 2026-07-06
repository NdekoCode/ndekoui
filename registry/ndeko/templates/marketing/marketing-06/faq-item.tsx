'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { CheckIcon, Link2Icon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/registry/ndeko/ui/accordion';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import type { Question } from './faq-data';
import { anchorOf, markedPartsOf } from './faq-model';

function Marked({ text, words }: { text: string; words: string[] }) {
  const parts = markedPartsOf(text, words);

  return (
    <>
      {parts.map((part) => {
        if (part.isMatch) {
          return (
            <mark
              key={part.key}
              className='bg-primary/15 text-foreground rounded-[3px]'
            >
              {part.text}
            </mark>
          );
        }
        return <span key={part.key}>{part.text}</span>;
      })}
    </>
  );
}

function linkLabelOf(isCopied: boolean) {
  if (isCopied) {
    return 'Link copied';
  }
  return 'Copy the link to this question';
}

type FaqItemProps = {
  question: Question;
  words: string[];
  pressed: string | null;
  isCopied: boolean;
  onCopyLink: (questionId: string) => void;
};

export function FaqItem({
  question,
  words,
  pressed,
  isCopied,
  onCopyLink,
}: FaqItemProps) {
  function copyLink() {
    onCopyLink(question.id);
  }

  return (
    <AccordionItem
      value={question.id}
      id={anchorOf(question.id)}
      className='scroll-mt-6'
    >
      <div className='flex items-center gap-1'>
        <div className='min-w-0 flex-1'>
          <AccordionTrigger
            className={cn(
              'text-sm',
              pressedQuietOf(pressed === `question-${question.id}`)
            )}
          >
            <span className='min-w-0 text-pretty'>
              <Marked text={question.question} words={words} />
            </span>
          </AccordionTrigger>
        </div>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label={linkLabelOf(isCopied)}
          onClick={copyLink}
          className={cn(
            'text-muted-foreground size-7 shrink-0',
            pressedQuietOf(pressed === `link-${question.id}`)
          )}
        >
          <Swap swapKey={String(isCopied)}>
            {isCopied && <CheckIcon className='size-3.5' />}
            {!isCopied && <Link2Icon className='size-3.5' />}
          </Swap>
        </Button>
      </div>
      <AccordionContent className='text-sm leading-relaxed text-pretty'>
        <Marked text={question.answer} words={words} />
      </AccordionContent>
    </AccordionItem>
  );
}
