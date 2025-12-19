import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';
import type { ReactNode } from 'react';

import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from '@/registry/ndeko/ui/accordion';

const QUESTIONS = [
  {
    value: 'free-plan',
    title: 'What is included in the free plan?',
    content:
      'Three projects, unlimited tasks and 30 days of activity history. Invite as many teammates as you need; billing starts only when you create a fourth project.',
  },
  {
    value: 'change-plan',
    title: 'Can I change my plan later?',
    content:
      'Yes. An upgrade applies right away and the difference is prorated on the next invoice. A downgrade takes effect at the end of the current billing period.',
  },
  {
    value: 'export',
    title: 'How do I export my data?',
    content:
      'Open Settings, then Export. You receive a ZIP archive with every project as a CSV file and every attachment in its original format, usually within a few minutes.',
  },
  {
    value: 'access',
    title: 'Who can see my projects?',
    content:
      'Only the members you invite. Each project keeps its own access list, and a guest sees only the projects they were added to.',
  },
];

const TRIGGER = [
  'group/accordion-trigger flex flex-1 cursor-pointer items-center justify-between gap-4 rounded-md py-3 text-left text-[13px] font-medium text-foreground transition-colors',
  'data-disabled:pointer-events-none data-disabled:opacity-50',
  FOCUS_RING,
].join(' ');

// PlusIcon draws its vertical stroke first: turning it flat and fading it leaves a minus.
const PLUS_MINUS = [
  'size-4 shrink-0 text-muted-foreground transition-[rotate] duration-200 ease-(--ease-out-strong) group-data-panel-open/accordion-trigger:rotate-180',
  '[&>path:first-child]:origin-center [&>path:first-child]:transition-[rotate,opacity] [&>path:first-child]:duration-200 [&>path:first-child]:ease-(--ease-out-strong)',
  'group-data-panel-open/accordion-trigger:[&>path:first-child]:rotate-90 group-data-panel-open/accordion-trigger:[&>path:first-child]:opacity-0',
].join(' ');

type PlusMinusTriggerProps = {
  className?: string;
  children: ReactNode;
};

function PlusMinusTrigger({ className, children }: PlusMinusTriggerProps) {
  return (
    <AccordionPrimitive.Header className='flex'>
      <AccordionPrimitive.Trigger className={cn(TRIGGER, className)}>
        {children}
        <PlusIcon className={PLUS_MINUS} />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

const CARD_ITEM = [
  'rounded-xl border-b-0 bg-card px-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border outline-none',
  'has-focus-visible:ring-[3px] has-focus-visible:ring-ring/25',
].join(' ');

export default function Accordion12() {
  return (
    <Accordion defaultValue={['export']} className='gap-2'>
      {QUESTIONS.map((question) => (
        <AccordionItem
          key={question.value}
          value={question.value}
          className={CARD_ITEM}
        >
          <PlusMinusTrigger className='focus-visible:ring-0'>
            {question.title}
          </PlusMinusTrigger>
          <AccordionContent>{question.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
