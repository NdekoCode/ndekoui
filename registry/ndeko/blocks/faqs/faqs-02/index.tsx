import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/registry/ndeko/ui/accordion';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';

import { CONTACT, QUESTIONS, SECTION } from './data';

const FIRST_QUESTION_ID = QUESTIONS[0].id;

function initialsOf(name: string) {
  const words = name.split(' ');
  const letters = words.map((word) => word.charAt(0));
  return letters.join('');
}

export default function Faqs02() {
  return (
    <section className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
      <div className='mx-auto flex max-w-2xl flex-col items-center gap-10'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {SECTION.description}
          </p>
        </div>
        <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] w-full rounded-xl px-5 py-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
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
        <div className='flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left'>
          <Avatar className='size-8'>
            <AvatarImage src={CONTACT.person.image} alt={CONTACT.person.name} />
            <AvatarFallback>{initialsOf(CONTACT.person.name)}</AvatarFallback>
          </Avatar>
          <p className='text-muted-foreground text-[13px] text-pretty'>
            {CONTACT.lead}{' '}
            <a
              href={CONTACT.href}
              className='text-primary-ink focus-visible:ring-ring/25 rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]'
            >
              {CONTACT.linkLabel}
            </a>{' '}
            {CONTACT.tail}
          </p>
        </div>
      </div>
    </section>
  );
}
