import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'dialog-01',
    source: 'comp-313',
    title: 'Confirmation dialog',
    description: 'An alert dialog that asks before an invoice goes out.',
  },
  {
    name: 'dialog-02',
    source: 'comp-314',
    title: 'Destructive confirmation',
    description:
      'An alert dialog with an error orb that names what gets deleted.',
  },
  {
    name: 'dialog-03',
    source: 'comp-315',
    title: 'Scrollable dialog',
    description: 'A long FAQ that scrolls with the native scrollbar.',
  },
  {
    name: 'dialog-04',
    source: 'comp-316',
    title: 'Scrollable dialog with custom scrollbar',
    description: 'The same FAQ inside a scroll area with a thin scrollbar.',
  },
  {
    name: 'dialog-05',
    source: 'comp-317',
    title: 'Dialog with fixed header',
    description:
      'The title stays in place while the questions scroll under it.',
  },
  {
    name: 'dialog-06',
    source: 'comp-318',
    title: 'Dialog with fixed footer',
    description: 'The actions stay at the bottom while the questions scroll.',
  },
  {
    name: 'dialog-07',
    source: 'comp-319',
    title: 'Terms dialog',
    description: 'Terms that can be accepted only once read to the end.',
  },
  {
    name: 'dialog-08',
    source: 'comp-320',
    title: 'Typed confirmation',
    description:
      'Deleting a project asks for its name before the button turns on.',
  },
  {
    name: 'dialog-09',
    source: 'comp-321',
    title: 'Newsletter dialog',
    description: 'An email field whose button turns into Subscribed.',
  },
  {
    name: 'dialog-10',
    source: 'comp-322',
    title: 'Feedback dialog',
    description: 'A short message with links to help, sent in place.',
  },
  {
    name: 'dialog-11',
    source: 'comp-323',
    title: 'Rating dialog',
    description: 'A scale from 0 to 8 on joined pills, then a reason.',
  },
  {
    name: 'dialog-12',
    source: 'comp-324',
    title: 'Confirmation code dialog',
    description: 'A 4-digit code that swaps the dialog to its confirmed step.',
  },
  {
    name: 'dialog-13',
    source: 'comp-325',
    title: 'Sign-up dialog',
    description: 'Name, email and password, with Google as the other way in.',
  },
  {
    name: 'dialog-14',
    source: 'comp-326',
    title: 'Sign-in dialog',
    description: 'Email and password with remember me and a reset link.',
  },
  {
    name: 'dialog-15',
    source: 'comp-327',
    title: 'Invite dialog',
    description: 'Email rows added one at a time and a link to copy.',
  },
  {
    name: 'dialog-16',
    source: 'comp-328',
    title: 'Card details dialog',
    description: 'Card number, expiry and CVC that format as you type.',
  },
  {
    name: 'dialog-17',
    source: 'comp-329',
    title: 'Checkout dialog',
    description: 'A billing period, card fields and a coupon field on demand.',
  },
  {
    name: 'dialog-18',
    source: 'comp-330',
    title: 'Plan dialog',
    description: 'Plans as choice cards, with what every paid plan includes.',
  },
  {
    name: 'dialog-19',
    source: 'comp-331',
    title: 'Profile dialog',
    description:
      'Cover, picture and profile fields between a fixed title and fixed actions.',
  },
  {
    name: 'dialog-20',
    source: 'comp-332',
    title: 'Onboarding dialog',
    description:
      'Four steps in one dialog that resizes, with an indicator that travels.',
  },
  {
    name: 'dialog-21',
    source: 'comp-333',
    title: 'Command palette',
    description: 'Commands opened from a search field or with Cmd K.',
  },
];
