'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { Button } from '@/registry/ndeko/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/registry/ndeko/ui/dialog';

type TermsSection = {
  title: string;
  text: string;
  items?: string[];
};

const TERMS_SECTIONS: TermsSection[] = [
  {
    title: 'Acceptance of terms',
    text: 'By creating an account or using the service, you agree to these terms. If you use it for a company, you confirm that you can accept them on its behalf.',
  },
  {
    title: 'Your account',
    text: 'Keep your password private and tell us right away if you think someone else used your account. You are responsible for what happens under it.',
  },
  {
    title: 'Your content',
    text: 'You own what you upload. You give us the permission we need to store, display and back it up so the service works.',
  },
  {
    title: 'Acceptable use',
    text: 'Do not use the service to:',
    items: [
      'break the law or the rights of others',
      'send spam or malware',
      'probe or overload our systems',
      'resell access without an agreement with us',
    ],
  },
  {
    title: 'Payments',
    text: 'Paid plans renew automatically until you cancel. Prices can change with 30 days of notice by email.',
  },
  {
    title: 'Limitation of liability',
    text: 'The service is provided as is. We are not liable for indirect losses, and our total liability is limited to what you paid in the last 12 months.',
  },
  {
    title: 'Changes to these terms',
    text: 'We email you before a material change takes effect. Using the service after that date means you accept the new terms.',
  },
  {
    title: 'Ending the agreement',
    text: 'You can close your account at any time. We may suspend an account that breaks these terms, and we tell you why.',
  },
  {
    title: 'Governing law',
    text: 'These terms are governed by the laws of the country where the company is registered, without regard to conflict of law rules.',
  },
];

const END_TOLERANCE_PX = 4;

const HINT_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SCROLL_BODY =
  'min-h-0 flex-1 overflow-y-auto px-6 pt-5 pb-5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 focus-visible:ring-inset [mask-image:linear-gradient(to_bottom,transparent,black_1.25rem,black_calc(100%_-_1.25rem),transparent)]';

function isScrolledToEnd(element: HTMLElement) {
  const visibleBottom = element.scrollTop + element.clientHeight;
  const contentEnd = element.scrollHeight - END_TOLERANCE_PX;
  return visibleBottom >= contentEnd;
}

function hintExitOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { opacity: 0 };
  }
  return { opacity: 0, filter: 'blur(2px)' };
}

export default function Dialog07() {
  const [hasReadToEnd, setHasReadToEnd] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const hintExit = hintExitOf(shouldReduceMotion);

  function markReadAtEnd(event: React.UIEvent<HTMLDivElement>) {
    if (isScrolledToEnd(event.currentTarget)) {
      setHasReadToEnd(true);
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant='outline' />}>
        Review terms
      </DialogTrigger>
      <DialogContent
        animateSize={false}
        className='h-[min(640px,80dvh)] overflow-hidden p-0'
        contentClassName='h-full gap-0'
      >
        <DialogHeader className='px-6 pt-6 pr-12'>
          <DialogTitle>Terms of service</DialogTitle>
        </DialogHeader>
        <div tabIndex={0} onScroll={markReadAtEnd} className={SCROLL_BODY}>
          <DialogDescription
            render={<div />}
            className='flex flex-col gap-4 leading-relaxed'
          >
            {TERMS_SECTIONS.map((section) => (
              <section key={section.title} className='flex flex-col gap-1'>
                <h3 className='text-foreground font-medium'>{section.title}</h3>
                <p>{section.text}</p>
                {section.items && (
                  <ul className='list-disc ps-5'>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </DialogDescription>
        </div>
        <DialogFooter className='px-6 pt-4 pb-6 sm:items-center'>
          <AnimatePresence initial={false}>
            {!hasReadToEnd && (
              <motion.span
                key='hint'
                className='text-muted-foreground grow text-xs max-sm:text-center'
                exit={hintExit}
                transition={HINT_TRANSITION}
              >
                Scroll to the end to accept.
              </motion.span>
            )}
          </AnimatePresence>
          <DialogClose render={<Button variant='outline' size='lg' />}>
            Cancel
          </DialogClose>
          <DialogClose disabled={!hasReadToEnd} render={<Button size='lg' />}>
            Accept terms
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
