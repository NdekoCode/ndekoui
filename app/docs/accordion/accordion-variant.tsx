import { ChevronRight } from 'lucide-react';

import {
    Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/core/accordion';

export function AccordionVariant() {
  return (
    <Accordion
      className='flex w-full flex-col'
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      variants={{
        expanded: {
          opacity: 1,
          scale: 1,
        },
        collapsed: {
          opacity: 0,
          scale: 0.7,
        },
      }}
    >
      <AccordionItem value='getting-started' className='py-2'>
        <AccordionTrigger className='w-full py-0.5 text-left text-zinc-950 dark:text-zinc-50'>
          <div className='flex items-center'>
            <ChevronRight className='group-data-expanded:rotate-90 h-4 w-4 text-zinc-950 transition-transform duration-200 dark:text-zinc-50' />
            <div className='ml-2 text-zinc-950 dark:text-zinc-50'>
              How do I start with Ndeko UI?
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className='origin-left'>
          <p className='pl-6 pr-2 text-zinc-500 dark:text-zinc-400'>
            Kick off your experience by setting up Ndeko UI. This section covers
            the basics of installation and how to add animations to your
            projects. You’ll get familiar with the initial setup and the core
            features quickly.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value='animation-properties' className='py-2'>
        <AccordionTrigger className='w-full py-0.5 text-left text-zinc-950 dark:text-zinc-50'>
          <div className='flex items-center'>
            <ChevronRight className='group-data-expanded:rotate-90 h-4 w-4 text-zinc-950 transition-transform duration-200 dark:text-zinc-50' />
            <div className='ml-2 text-zinc-950 dark:text-zinc-50'>
              What are the key animation properties?
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className='origin-left'>
          <p className='pl-6 pr-2 text-zinc-500 dark:text-zinc-400'>
            Discover a variety of properties to customize your animations. Learn
            to adjust timing, easing, and delays for smoother effects. This
            guide will help you tailor these settings to your app’s needs.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value='advanced-features' className='py-2'>
        <AccordionTrigger className='w-full py-0.5 text-left text-zinc-950 dark:text-zinc-50'>
          <div className='flex items-center'>
            <ChevronRight className='group-data-expanded:rotate-90 h-4 w-4 text-zinc-950 transition-transform duration-200 dark:text-zinc-50' />
            <div className='ml-2 text-zinc-950 dark:text-zinc-50'>
              How do I use advanced features?
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className='origin-left'>
          <p className='pl-6 pr-2 text-zinc-500 dark:text-zinc-400'>
            Advance your skills by using more complex functions of Ndeko UI.
            Explore how to link animations together, create intricate sequences,
            and interact with motion sensors for dynamic effects.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value='community-support' className='py-2'>
        <AccordionTrigger className='w-full py-0.5 text-left text-zinc-950 dark:text-zinc-50'>
          <div className='flex items-center'>
            <ChevronRight className='group-data-expanded:rotate-90 h-4 w-4 text-zinc-950 transition-transform duration-200 dark:text-zinc-50' />
            <div className='ml-2 text-zinc-950 dark:text-zinc-50'>
              How do I engage with the community?
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className='origin-left'>
          <p className='pl-6 pr-2 text-zinc-500 dark:text-zinc-400'>
            Connect with the Ndeko UI community for support and collaboration.
            Learn how to contribute, share knowledge, and access helpful
            resources. Stay updated on new updates and collective insights.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
