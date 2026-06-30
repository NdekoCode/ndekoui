import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'notification-01',
    source: 'comp-279',
    title: 'Warning notice',
    description: 'A one-line notice with a warning orb.',
  },
  {
    name: 'notification-02',
    source: 'comp-280',
    title: 'Error notice',
    description: 'A one-line notice for something that failed.',
  },
  {
    name: 'notification-03',
    source: 'comp-281',
    title: 'Success notice',
    description: 'A one-line notice that confirms a save.',
  },
  {
    name: 'notification-04',
    source: 'comp-282',
    title: 'Info notice',
    description: 'A one-line notice about a change ahead.',
  },
  {
    name: 'notification-05',
    source: 'comp-283',
    title: 'Warning notice with link',
    description: 'The warning notice with a link to fix it.',
  },
  {
    name: 'notification-06',
    source: 'comp-284',
    title: 'Error notice with link',
    description: 'The error notice with a link to the reason.',
  },
  {
    name: 'notification-07',
    source: 'comp-285',
    title: 'Success notice with link',
    description: 'The success notice with a link to the result.',
  },
  {
    name: 'notification-08',
    source: 'comp-286',
    title: 'Info notice with link',
    description: 'The info notice with a link to read more.',
  },
  {
    name: 'notification-09',
    source: 'comp-287',
    title: 'Notice with undo',
    description: 'A success notice with an Undo button.',
  },
  {
    name: 'notification-10',
    source: 'comp-288',
    title: 'Notice with text actions',
    description: 'A sent message with View and Undo as links.',
  },
  {
    name: 'notification-11',
    source: 'comp-289',
    title: 'Warning notice with action',
    description: 'A title, the reason and the action that resolves it.',
  },
  {
    name: 'notification-12',
    source: 'comp-290',
    title: 'Error notice with action',
    description: 'A failed payment with the action that fixes it.',
  },
  {
    name: 'notification-13',
    source: 'comp-291',
    title: 'Success notice with action',
    description: 'A finished export with its download.',
  },
  {
    name: 'notification-14',
    source: 'comp-292',
    title: 'Info notice with action',
    description: 'Planned maintenance with a link to the status page.',
  },
  {
    name: 'notification-15',
    source: 'comp-293',
    title: 'Cookie notice',
    description: 'A consent notice where declining is as easy as accepting.',
  },
  {
    name: 'notification-16',
    source: 'comp-294',
    title: 'Update notice',
    description: 'A new version to install now or later.',
  },
  {
    name: 'notification-17',
    source: 'comp-295',
    title: 'Invitation notice',
    description: 'Who invited you to what, with Accept or Decline.',
  },
  {
    name: 'notification-18',
    source: 'comp-296',
    title: 'Event notice',
    description: 'An upcoming live event with a reminder button.',
  },
  {
    name: 'notification-19',
    source: 'comp-297',
    title: 'Error toast with retry',
    description:
      'A failed send whose retry turns the toast into loading, then success.',
  },
  {
    name: 'notification-20',
    source: 'comp-298',
    title: 'Toast with timer',
    description:
      'A custom toast that closes after 5 seconds and pauses while hovered.',
  },
  {
    name: 'notification-21',
    source: 'comp-299',
    title: 'Toast with undo',
    description: 'A toast with a description and an Undo action.',
  },
  {
    name: 'notification-22',
    source: 'comp-300',
    title: 'Custom toast',
    description: 'A sent message in a custom toast with View and Undo.',
  },
  {
    name: 'notification-23',
    source: 'ndeko',
    title: 'Inbox with unread states',
    description:
      'An inbox where opening a row reads it, the dot shrinks away and Mark all as read clears the count.',
  },
  {
    name: 'notification-24',
    source: 'ndeko',
    title: 'Activity grouped by day',
    description:
      'Notifications under Today, Yesterday and Earlier, each one snoozed or muted in place, with snoozed ones brought back from the header.',
  },
  {
    name: 'notification-25',
    source: 'ndeko',
    title: 'Bell with filtered inbox',
    description:
      'A bell that opens the inbox, with All, Mentions and Invites tabs that carry their unread counts.',
  },
  {
    name: 'notification-26',
    source: 'ndeko',
    title: 'Invitation with its answer',
    description:
      'A team invitation whose Accept and Decline turn into the result, with Undo.',
  },
  {
    name: 'notification-27',
    source: 'ndeko',
    title: 'Task activity thread',
    description:
      'The latest change on a task under its chip, with the earlier updates folded below.',
  },
  {
    name: 'notification-28',
    source: 'ndeko',
    title: 'Stack of notifications',
    description:
      'Toasts stacked one behind the other that spread out on hover, focus or a pinned toggle.',
  },
  {
    name: 'notification-29',
    source: 'ndeko',
    title: 'Notices in their tone',
    description:
      'Success, error and info notices washed in their own hue, each dismissed with its space closing.',
  },
  {
    name: 'notification-30',
    source: 'ndeko',
    title: 'Notification preferences',
    description:
      'One switch per kind of notification, saved as it changes, with the kind dimmed when it is off.',
  },
];
