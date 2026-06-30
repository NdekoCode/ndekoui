import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'modal-01',
    source: 'ndeko',
    title: 'Invite people',
    description:
      'Addresses become chips tinted by what sending does to them, with the role of the batch and the pending invitations to resend or revoke',
  },
  {
    name: 'modal-02',
    source: 'ndeko',
    title: 'Invite with a seat limit',
    description:
      'A seat meter that reserves a seat for each address in the field and flags the ones left without a seat',
  },
  {
    name: 'modal-03',
    source: 'ndeko',
    title: 'Invite with a link and a QR code',
    description:
      'A link to copy with its expiry and approval, an illustrative QR code and a join code that change together when the link is reset',
  },
  {
    name: 'modal-04',
    source: 'ndeko',
    title: 'Invite into a project',
    description:
      'Teammates searched and added to the project with an access level, each one changeable or removable in the list',
  },
  {
    name: 'modal-05',
    source: 'ndeko',
    title: 'Share a project',
    description:
      'Who can open the project as three access levels with a travelling highlight, what the link allows and the link to copy',
  },
  {
    name: 'modal-06',
    source: 'ndeko',
    title: 'Manage access',
    description:
      'A role on a segmented control sets the permission switches, and changing one marks the access as custom with a way back',
  },
  {
    name: 'modal-07',
    source: 'ndeko',
    title: 'Workspace access',
    description:
      'A join code to copy or renew, allowed e-mail domains added in a dashed slot and the role of people who join',
  },
  {
    name: 'modal-08',
    source: 'ndeko',
    title: 'Add members from the directory',
    description:
      'Workspace people outside the team, picked with checkboxes into an avatar stack and added in one go',
  },
  {
    name: 'modal-09',
    source: 'ndeko',
    title: 'Give feedback',
    description:
      'A kind, a five-step scale, a follow-up question that follows the rating, a screenshot slot and a thank-you state',
  },
  {
    name: 'modal-10',
    source: 'ndeko',
    title: 'Schedule a meeting',
    description:
      'Attendees as chips, the next free slots, a duration and a meeting link, summed up in one sentence that rewrites itself',
  },
  {
    name: 'modal-11',
    source: 'ndeko',
    title: 'Search people',
    description:
      'An @ mention search over members, pending invitations and guests, with highlighted matches and arrow-key picking',
  },
  {
    name: 'modal-12',
    source: 'ndeko',
    title: 'Recent searches',
    description:
      'A search with scoped filter pills and a history of recent searches you prune one by one or all at once',
  },
  {
    name: 'modal-13',
    source: 'ndeko',
    title: 'Delete a workspace',
    description:
      'The workspace and what deleting it does come first, then its name typed to confirm and a restore offer once deleted',
  },
  {
    name: 'modal-14',
    source: 'ndeko',
    title: 'Payment record',
    description:
      'Time entries with their total, the earnings breakdown with the take-home figure, an invoice export and a paid status',
  },
];
