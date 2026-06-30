import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'comment-01',
    source: 'ndeko',
    title: 'Thread with replies',
    description:
      'Comments with replies one level deep, a reply field that opens in place and replies that fold under their count',
  },
  {
    name: 'comment-02',
    source: 'ndeko',
    title: 'Mention suggestions',
    description:
      'A comment field where @ lists the team, arrows and Enter pick a name and each mention is tinted in the text',
  },
  {
    name: 'comment-03',
    source: 'ndeko',
    title: 'Reactions',
    description:
      'Reaction chips you toggle with a rolling count and the names in a tooltip, and a picker for a new one',
  },
  {
    name: 'comment-04',
    source: 'ndeko',
    title: 'Edit in place',
    description:
      'Your comment turns into its own field to edit, marks itself edited, and leaves an Undo line when deleted',
  },
  {
    name: 'comment-05',
    source: 'ndeko',
    title: 'Resolved thread',
    description:
      'A discussion that folds into one resolved line, opens again to read and can be reopened',
  },
  {
    name: 'comment-06',
    source: 'ndeko',
    title: 'Comment with attachments',
    description:
      'Files staged as chips while they upload, refused with a reason when too large, and shown as tiles once posted',
  },
  {
    name: 'comment-07',
    source: 'ndeko',
    title: 'Unread marker',
    description:
      'A count of new comments above the first unread one, cleared with Mark as read',
  },
  {
    name: 'comment-08',
    source: 'ndeko',
    title: 'Someone is typing',
    description:
      'A typing row under the avatar of the person writing, which becomes their comment when it arrives',
  },
];
