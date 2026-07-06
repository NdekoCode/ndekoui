import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'popover-01',
    source: 'comp-381',
    title: 'Filter popover',
    description: 'Checkboxes to pick widgets, with clear and apply.',
  },
  {
    name: 'popover-02',
    source: 'comp-382',
    title: 'Notifications popover',
    description:
      'A bell with an unread count and a list that marks items as read.',
  },
  {
    name: 'popover-03',
    source: 'comp-383',
    title: 'Notifications with avatars',
    description: 'The notification list with an avatar for each person.',
  },
  {
    name: 'popover-04',
    source: 'comp-384',
    title: 'Hint popover',
    description:
      'A compact explanation with one action, too rich for a tooltip.',
  },
  {
    name: 'popover-05',
    source: 'comp-385',
    title: 'Tips popover',
    description: 'Short tips read one after another, then start over.',
  },
  {
    name: 'popover-06',
    source: 'comp-386',
    title: 'Tips with navigation',
    description: 'Tips with previous and next buttons and a step count.',
  },
  {
    name: 'popover-07',
    source: 'comp-387',
    title: 'Share popover',
    description: 'Share buttons and a link to copy in one click.',
  },
  {
    name: 'popover-08',
    source: 'comp-388',
    title: 'Feedback popover',
    description: 'A short form that confirms when the message is sent.',
  },
  {
    name: 'popover-09',
    source: 'comp-389',
    title: 'Guided tour',
    description:
      'A popover that moves from one spot to the next with its arrow.',
  },
  {
    name: 'popover-10',
    source: 'ndeko',
    title: 'Emoji field',
    description:
      'Emoji packed in a round field that keeps gliding after a fling and swells under the middle; a tapped one flies into the message where the caret is.',
  },
];
