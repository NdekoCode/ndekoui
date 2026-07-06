import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/registry/ndeko/ui/accordion';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import { QUESTIONS, QUESTIONS_ANCHOR, QUESTIONS_SECTION } from './data';
import { Reveal } from './reveal';

export function Faq() {
  return (
    <section
      id={QUESTIONS_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-20 @5xl:px-8'
    >
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='grid gap-8 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @4xl:gap-16'
      >
        <SettleItem className='flex flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {QUESTIONS_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {QUESTIONS_SECTION.description}
          </p>
        </SettleItem>
        <SettleItem>
          <Accordion defaultValue={[QUESTIONS[0].id]}>
            {QUESTIONS.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className='text-sm'>
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className='text-sm text-pretty'>
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SettleItem>
      </Reveal>
    </section>
  );
}
