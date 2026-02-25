import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/core/accordion';
import { ChevronRightIcon } from '@/registry/ndeko/lib/icons';

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
        <AccordionTrigger className='text-foreground w-full py-0.5 text-left text-sm font-medium'>
          <div className='flex items-center'>
            <ChevronRightIcon className='text-muted-foreground size-4 transition-transform duration-200 group-data-expanded:rotate-90' />
            <div className='ml-2'>How do I move my team to Tidewell?</div>
          </div>
        </AccordionTrigger>
        <AccordionContent className='origin-left'>
          <p className='text-muted-foreground pt-1 pr-2 pl-6 text-[13px]'>
            Import your boards from a CSV file or connect your old tool from the
            import page. Members keep their assignments, and due dates land on
            the same days in every time zone.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value='notifications' className='py-2'>
        <AccordionTrigger className='text-foreground w-full py-0.5 text-left text-sm font-medium'>
          <div className='flex items-center'>
            <ChevronRightIcon className='text-muted-foreground size-4 transition-transform duration-200 group-data-expanded:rotate-90' />
            <div className='ml-2'>Can I choose which notifications I get?</div>
          </div>
        </AccordionTrigger>
        <AccordionContent className='origin-left'>
          <p className='text-muted-foreground pt-1 pr-2 pl-6 text-[13px]'>
            Yes. Pick a channel for each kind of update: mentions by email,
            assignments in the app, a daily summary at 9 am. Quiet hours mute
            everything except direct mentions.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value='offline' className='py-2'>
        <AccordionTrigger className='text-foreground w-full py-0.5 text-left text-sm font-medium'>
          <div className='flex items-center'>
            <ChevronRightIcon className='text-muted-foreground size-4 transition-transform duration-200 group-data-expanded:rotate-90' />
            <div className='ml-2'>Does it work offline?</div>
          </div>
        </AccordionTrigger>
        <AccordionContent className='origin-left'>
          <p className='text-muted-foreground pt-1 pr-2 pl-6 text-[13px]'>
            The desktop app keeps the last 30 days of boards on your device.
            Changes made offline sync as soon as you are back online, and
            conflicts are listed for you to review.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value='cancel-plan' className='py-2'>
        <AccordionTrigger className='text-foreground w-full py-0.5 text-left text-sm font-medium'>
          <div className='flex items-center'>
            <ChevronRightIcon className='text-muted-foreground size-4 transition-transform duration-200 group-data-expanded:rotate-90' />
            <div className='ml-2'>What happens if I cancel my plan?</div>
          </div>
        </AccordionTrigger>
        <AccordionContent className='origin-left'>
          <p className='text-muted-foreground pt-1 pr-2 pl-6 text-[13px]'>
            Your workspace switches to the free plan at the end of the billing
            period. Nothing is deleted: boards over the free limit become read
            only until you upgrade again.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
