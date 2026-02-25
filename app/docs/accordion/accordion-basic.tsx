import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/core/accordion';

export function AccordionBasic() {
  return (
    <Accordion className='hairline-divide-y divide-border flex w-full flex-col'>
      <AccordionItem value='getting-started' className='py-2'>
        <AccordionTrigger className='text-foreground w-full py-0.5 text-left text-sm font-medium'>
          Getting started
        </AccordionTrigger>
        <AccordionContent>
          <p className='text-muted-foreground pt-1 text-[13px]'>
            Create a workspace, invite two teammates and connect the calendar
            you already use. Tidewell copies your existing events in the
            background, so your first week is ready before you finish setting up
            your profile.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value='sharing-a-workspace' className='py-2'>
        <AccordionTrigger className='text-foreground w-full py-0.5 text-left text-sm font-medium'>
          Sharing a workspace
        </AccordionTrigger>
        <AccordionContent>
          <p className='text-muted-foreground pt-1 text-[13px]'>
            Every member sees the boards they belong to and nothing else. Guests
            can comment on a single board without joining the workspace, and you
            can remove their access at any time from the members page.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value='billing-and-invoices' className='py-2'>
        <AccordionTrigger className='text-foreground w-full py-0.5 text-left text-sm font-medium'>
          Billing and invoices
        </AccordionTrigger>
        <AccordionContent>
          <p className='text-muted-foreground pt-1 text-[13px]'>
            You are billed per active member at the start of each month.
            Invoices are emailed to the workspace owner and stay available in
            the billing settings, ready to download as PDF.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value='exporting-your-data' className='py-2'>
        <AccordionTrigger className='text-foreground w-full py-0.5 text-left text-sm font-medium'>
          Exporting your data
        </AccordionTrigger>
        <AccordionContent>
          <p className='text-muted-foreground pt-1 text-[13px]'>
            Export boards, comments and attachments as a single archive from the
            workspace settings. Large workspaces take a few minutes; we email
            you a link when the archive is ready.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
