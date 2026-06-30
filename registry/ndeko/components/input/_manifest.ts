import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'input-01',
    source: 'comp-01',
    title: 'Simple input',
    description: 'An email field with its label above.',
  },
  {
    name: 'input-02',
    source: 'comp-02',
    title: 'Required input',
    description: 'A field whose label carries a required mark.',
  },
  {
    name: 'input-03',
    source: 'comp-03',
    title: 'Input with helper text',
    description: 'A field with a short hint under it.',
  },
  {
    name: 'input-04',
    source: 'comp-04',
    title: 'Input with hint',
    description: 'A label with an Optional hint on its right.',
  },
  {
    name: 'input-05',
    source: 'comp-05',
    title: 'Input with brand focus',
    description:
      'A field whose border and halo take the brand colour on focus.',
  },
  {
    name: 'input-06',
    source: 'comp-06',
    title: 'Input with error',
    description: 'An invalid field with a message that says how to fix it.',
  },
  {
    name: 'input-07',
    source: 'comp-07',
    title: 'Filled input',
    description: 'A field on a soft grey fill without an outline.',
  },
  {
    name: 'input-08',
    source: 'comp-08',
    title: 'Disabled input',
    description: 'A field and its label dimmed while it cannot be edited.',
  },
  {
    name: 'input-09',
    source: 'comp-09',
    title: 'Input with start icon',
    description: 'An at sign before a username.',
  },
  {
    name: 'input-10',
    source: 'comp-10',
    title: 'Input with end icon',
    description: 'A mail icon at the end of an email field.',
  },
  {
    name: 'input-11',
    source: 'comp-11',
    title: 'Input with start inline add-on',
    description: 'The protocol written inside the field before the address.',
  },
  {
    name: 'input-12',
    source: 'comp-12',
    title: 'Input with end inline add-on',
    description: 'A domain ending written inside the field after the name.',
  },
  {
    name: 'input-13',
    source: 'comp-13',
    title: 'Input with inline add-ons',
    description: 'A price between a currency sign and its code.',
  },
  {
    name: 'input-14',
    source: 'comp-14',
    title: 'Input with start add-on',
    description:
      'The protocol in its own segment, inside the outline of the address.',
  },
  {
    name: 'input-15',
    source: 'comp-15',
    title: 'Input with end add-on',
    description: 'A domain ending in its own segment after the name.',
  },
  {
    name: 'input-16',
    source: 'comp-16',
    title: 'Input with inline and end add-ons',
    description:
      'A price with an inline currency sign and a segment for its code.',
  },
  {
    name: 'input-17',
    source: 'comp-17',
    title: 'Input with start select',
    description: 'A protocol picked from a native select before the address.',
  },
  {
    name: 'input-18',
    source: 'comp-18',
    title: 'Input with end select',
    description: 'A domain ending picked from a native select after the name.',
  },
  {
    name: 'input-19',
    source: 'comp-19',
    title: 'Input with inline button',
    description: 'A send button inside the end of a newsletter field.',
  },
  {
    name: 'input-20',
    source: 'comp-20',
    title: 'Input with end icon button',
    description:
      'A download button in its own segment after an invoice number.',
  },
  {
    name: 'input-21',
    source: 'comp-21',
    title: 'Input with end button',
    description: 'A Send invite segment after an email field.',
  },
  {
    name: 'input-22',
    source: 'comp-22',
    title: 'Input with button',
    description: 'An email field next to an outline Subscribe pill.',
  },
  {
    name: 'input-23',
    source: 'comp-23',
    title: 'Password with show toggle',
    description:
      'An eye button reveals or hides the password and swaps its icon.',
  },
  {
    name: 'input-24',
    source: 'comp-24',
    title: 'Input with clear button',
    description:
      'A clear button that appears with a value and empties the field.',
  },
  {
    name: 'input-25',
    source: 'comp-25',
    title: 'Search with shortcut',
    description:
      'A search field that shows its keyboard shortcut on a key cap.',
  },
  {
    name: 'input-26',
    source: 'comp-26',
    title: 'Search with icon and button',
    description: 'A search icon before the query and a submit arrow after it.',
  },
  {
    name: 'input-27',
    source: 'comp-27',
    title: 'Search with loader',
    description: 'The search icon turns into a spinner while results load.',
  },
  {
    name: 'input-28',
    source: 'comp-28',
    title: 'Number input with steppers',
    description: 'Minus and plus segments around a number.',
  },
  {
    name: 'input-29',
    source: 'comp-29',
    title: 'Number input with chevrons',
    description: 'A euro amount with stacked up and down steppers.',
  },
  {
    name: 'input-30',
    source: 'comp-30',
    title: 'File input',
    description: 'A native file picker with its button inside the field.',
  },
  {
    name: 'input-31',
    source: 'comp-31',
    title: 'Input with overlapping label',
    description: 'A small label sitting on the top edge of the field.',
  },
  {
    name: 'input-32',
    source: 'comp-32',
    title: 'Floating label',
    description:
      'A label that moves up to the edge when the field is focused or filled.',
  },
  {
    name: 'input-33',
    source: 'comp-33',
    title: 'Input with inset label',
    description: 'The label and the value inside one outline.',
  },
  {
    name: 'input-34',
    source: 'comp-34',
    title: 'Input with character limit',
    description: 'A counter at the end of the field that slides as you type.',
  },
  {
    name: 'input-35',
    source: 'comp-35',
    title: 'Input with characters left',
    description: 'A hint under the field that counts what remains.',
  },
  {
    name: 'input-36',
    source: 'comp-36',
    title: 'Date input',
    description: 'A date typed segment by segment.',
  },
  {
    name: 'input-37',
    source: 'comp-37',
    title: 'Time input',
    description: 'A time typed segment by segment.',
  },
  {
    name: 'input-38',
    source: 'comp-38',
    title: 'Time input with start icon',
    description: 'A clock before the time segments.',
  },
  {
    name: 'input-39',
    source: 'comp-39',
    title: 'Time input with end icon',
    description: 'A clock after the time segments.',
  },
  {
    name: 'input-40',
    source: 'comp-40',
    title: 'Date and time input',
    description: 'A date with hours and minutes on a 24 hour clock.',
  },
  {
    name: 'input-41',
    source: 'comp-41',
    title: 'Date picker',
    description: 'A typed date with a button that opens a calendar.',
  },
  {
    name: 'input-42',
    source: 'comp-42',
    title: 'Date range picker',
    description: 'Start and end dates with a range calendar.',
  },
  {
    name: 'input-43',
    source: 'comp-43',
    title: 'Date range with unavailable days',
    description:
      'Weekends and booked days cannot be picked, and a range over them says why.',
  },
  {
    name: 'input-44',
    source: 'comp-44',
    title: 'Joined code input',
    description: 'Four code slots joined into one control.',
  },
  {
    name: 'input-45',
    source: 'comp-45',
    title: 'Split code input',
    description: 'Six code slots in two joined groups of three.',
  },
  {
    name: 'input-46',
    source: 'comp-58',
    title: 'Spaced code input',
    description: 'Four separate code slots.',
  },
  {
    name: 'input-47',
    source: 'comp-46',
    title: 'Phone number input',
    description:
      'A country picker with its flag before an international number.',
  },
  {
    name: 'input-48',
    source: 'comp-47',
    title: 'Card number input',
    description: 'A card number that formats itself as you type.',
  },
  {
    name: 'input-49',
    source: 'comp-48',
    title: 'Expiry date input',
    description: 'A card expiry date that formats itself as you type.',
  },
  {
    name: 'input-50',
    source: 'comp-49',
    title: 'Security code input',
    description: 'A card security code field.',
  },
  {
    name: 'input-51',
    source: 'comp-50',
    title: 'Card details',
    description:
      'Number, expiry and code in one outline, with the card brand once it is known.',
  },
  {
    name: 'input-52',
    source: 'comp-51',
    title: 'Password strength',
    description: 'A meter and a checklist that update as the password grows.',
  },
  {
    name: 'input-53',
    source: 'comp-52',
    title: 'Read-only input',
    description: 'A value on a soft fill that can be selected but not edited.',
  },
  {
    name: 'input-54',
    source: 'comp-53',
    title: 'Copy to clipboard',
    description:
      'A read-only link with a copy button that confirms with a check.',
  },
  {
    name: 'input-55',
    source: 'comp-54',
    title: 'Masked input',
    description: 'A license plate field that follows a fixed pattern.',
  },
  {
    name: 'input-56',
    source: 'comp-55',
    title: 'Timestamp input',
    description: 'Hours, minutes and seconds typed into a mask.',
  },
  {
    name: 'input-57',
    source: 'comp-486',
    title: 'Range input',
    description: 'Minimum and maximum prices side by side in one outline.',
  },
  {
    name: 'input-58',
    source: 'comp-56',
    title: 'Input with tags',
    description:
      'A tag is added on Enter and removed from its chip under the field.',
  },
  {
    name: 'input-59',
    source: 'comp-57',
    title: 'Input with inner tags',
    description:
      'Tags sit inside the field and Backspace removes the last one.',
  },
  {
    name: 'input-60',
    source: 'ui-layouts:password',
    title: 'Password with morphing reveal',
    description:
      'Showing the password turns each dot into its character one after the other, in a monospace face.',
  },
  {
    name: 'input-61',
    source: 'ui-layouts:password',
    title: 'Password with Caps Lock warning',
    description:
      'The hint under the field becomes a warning while Caps Lock is on and the field has focus.',
  },
  {
    name: 'input-62',
    source: 'ui-layouts:password',
    title: 'Confirm password with match state',
    description:
      'The confirmation stays quiet while it follows the password and shows a cross or a check once it differs or matches.',
  },
  {
    name: 'input-63',
    source: 'ui-layouts:password',
    title: 'Segmented strength meter',
    description:
      'Four segments fill in turn as the password gets stronger and the strength label slides in the same direction.',
  },
  {
    name: 'input-64',
    source: 'ui-layouts:password',
    title: 'Password rule chips',
    description:
      'Each rule is a chip that turns green and swaps its circle for a check once the password meets it.',
  },
];
