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

const SECTIONS = [
  {
    value: 'accounts',
    title: 'Connected accounts',
    description: 'Manage your linked social and work accounts',
    content:
      'Connect a Google, GitHub or Microsoft account to sign in with one click and bring your preferences along. You can revoke access to any connected account at any time.',
  },
  {
    value: 'notifications',
    title: 'Notifications',
    description: 'Choose which updates reach you',
    content:
      'Pick the updates you want: security alerts, billing updates, product announcements, usage reports and scheduled maintenance. Each one can arrive by email, SMS or push notification.',
  },
  {
    value: 'two-step',
    title: '2-step verification',
    description: 'Add an extra layer of security to your account',
    content:
      'Ask for a second step at sign-in: an authenticator app, a code sent by SMS or a security key. An authenticator app is the most secure choice.',
  },
  {
    value: 'support',
    title: 'Contact support',
    description: 'Reach the team by chat or email',
    content:
      'For billing questions, technical issues or anything else, start a live chat, write to support@example.com or book a call with the technical team.',
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

export default function Accordion08() {
  return (
    <Accordion defaultValue={['two-step']}>
      {SECTIONS.map((section) => (
        <AccordionItem key={section.value} value={section.value}>
          <PlusMinusTrigger>
            <span className='flex flex-col gap-0.5'>
              <span>{section.title}</span>
              <span className='text-muted-foreground text-xs font-normal'>
                {section.description}
              </span>
            </span>
          </PlusMinusTrigger>
          <AccordionContent>{section.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
