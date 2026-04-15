import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/registry/ndeko/ui/accordion';
import { Button } from '@/registry/ndeko/ui/button';

import { FAQ, QUESTION_GROUPS } from './data';

const FIRST_QUESTION_ID = QUESTION_GROUPS[0].questions[0].id;

export function Faq() {
  return (
    <section className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
      <div className='mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16'>
        <div className='flex flex-col items-start gap-6 lg:sticky lg:top-12 lg:self-start'>
          <div className='flex flex-col gap-3'>
            <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
              {FAQ.title}
            </h2>
            <p className='text-muted-foreground max-w-sm text-base text-pretty'>
              {FAQ.description}
            </p>
          </div>
          <nav aria-label='Question topics' className='hidden lg:block'>
            <ul className='flex flex-col gap-0.5'>
              {QUESTION_GROUPS.map((group) => (
                <li key={group.id}>
                  <a
                    href={`#${group.id}`}
                    className='text-muted-foreground hover:text-foreground hover:bg-foreground/5 focus-visible:ring-ring/25 -mx-2 flex h-8 items-center rounded-md px-2 text-[13px] transition-colors outline-none focus-visible:ring-[3px]'
                  >
                    {group.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Button
            variant='outline'
            nativeButton={false}
            render={<a href={FAQ.contactHref} />}
          >
            {FAQ.contactLabel}
          </Button>
        </div>
        <div className='flex flex-col gap-10'>
          {QUESTION_GROUPS.map((group) => (
            <section
              key={group.id}
              id={group.id}
              aria-labelledby={`${group.id}-title`}
              className='flex scroll-mt-8 flex-col gap-1'
            >
              <h3
                id={`${group.id}-title`}
                className='text-primary-ink text-xs font-medium'
              >
                {group.title}
              </h3>
              <Accordion defaultValue={[FIRST_QUESTION_ID]}>
                {group.questions.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className='text-sm'>
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className='text-sm leading-relaxed text-pretty'>
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
