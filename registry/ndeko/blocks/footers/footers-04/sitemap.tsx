import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/registry/ndeko/ui/accordion';

import { CATEGORIES } from './data';

const LINK =
  'text-foreground/80 hover:text-foreground focus-visible:ring-ring/25 rounded-sm text-[13px] transition-colors outline-none focus-visible:ring-[3px]';

export function Sitemap() {
  return (
    <nav aria-label='Footer'>
      <Accordion className='sm:hidden'>
        {CATEGORIES.map((category) => (
          <AccordionItem key={category.title} value={category.title}>
            <AccordionTrigger>{category.title}</AccordionTrigger>
            <AccordionContent>
              <ul className='flex flex-col gap-2.5 pb-1'>
                {category.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className={LINK}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className='hidden gap-x-6 gap-y-10 sm:grid sm:grid-cols-3 lg:grid-cols-5'>
        {CATEGORIES.map((category) => (
          <div key={category.title} className='flex flex-col gap-3'>
            <h2 className='text-muted-foreground text-xs font-medium'>
              {category.title}
            </h2>
            <ul className='flex flex-col gap-2'>
              {category.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className={LINK}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
