import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/registry/ndeko/ui/accordion';

import { FAQ, FAQ_ANCHOR, QUESTIONS } from './data';

const FIRST_QUESTION_ID = QUESTIONS[0].id;

export function Faq() {
  return (
    <section id={FAQ_ANCHOR} className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
      <div className='mx-auto flex max-w-2xl flex-col items-center gap-10'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {FAQ.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {FAQ.description}
          </p>
        </div>
        <div className='bg-card hairline-ring ring-border w-full rounded-xl px-5 py-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
          <Accordion defaultValue={[FIRST_QUESTION_ID]}>
            {QUESTIONS.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className='py-4 text-sm'>
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className='pb-4 text-sm leading-relaxed text-pretty'>
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
