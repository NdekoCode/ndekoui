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

const FAQ_ITEMS = [
  {
    question: 'Creating an account',
    answer:
      'Sign up with your work email and open the link we send you. You can also join with Google if your company uses it.',
  },
  {
    question: 'Resetting your password',
    answer:
      'Choose Forgot password on the sign-in page and follow the link in the email. The link works for 30 minutes.',
  },
  {
    question: 'Plans and billing',
    answer:
      'The Free plan covers up to 3 projects. The Team plan adds unlimited projects, guests and version history, billed per member each month.',
  },
  {
    question: 'Getting help',
    answer:
      'Write to support from the help menu at any time. We answer within one business day.',
  },
  {
    question: 'Keeping your data safe',
    answer:
      'Data is encrypted in transit and at rest. Admins can require single sign-on and see a log of every sign-in.',
  },
  {
    question: 'Supported devices',
    answer:
      'The web app runs in any current browser. Desktop apps exist for macOS and Windows, mobile apps for iOS and Android.',
  },
  {
    question: 'Cancelling a subscription',
    answer:
      'Cancel from Settings, then Billing. Your workspace stays on the paid plan until the end of the period you paid for.',
  },
  {
    question: 'Payment methods',
    answer:
      'We accept major credit cards, and bank transfers for yearly plans. Invoices go to the billing email every month.',
  },
  {
    question: 'Exporting your work',
    answer:
      'Export any project as CSV or JSON from its settings. Exports include tasks, comments and links to attachments.',
  },
];

export default function Dialog03() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant='outline' />}>
        Open FAQ
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className='max-h-[min(640px,80dvh)]'
      >
        <DialogHeader className='pr-0'>
          <DialogTitle>Frequently asked questions</DialogTitle>
        </DialogHeader>
        <DialogDescription
          render={<div />}
          className='flex flex-col gap-4 leading-relaxed'
        >
          {FAQ_ITEMS.map((item) => (
            <section key={item.question} className='flex flex-col gap-1'>
              <h3 className='text-foreground font-medium'>{item.question}</h3>
              <p>{item.answer}</p>
            </section>
          ))}
        </DialogDescription>
        <DialogFooter>
          <Button
            variant='outline'
            size='lg'
            render={<a href='#' />}
            nativeButton={false}
          >
            Contact support
          </Button>
          <DialogClose render={<Button size='lg' />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
