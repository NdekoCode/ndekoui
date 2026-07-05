import type { ApprovalRequest, PlanStep } from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export const PROMPT =
  'Which accounts are at risk this quarter? Email the owner of the biggest one.';

export const CONVERSATION_TITLE = 'Renewals at risk';

export const person = {
  name: 'Lena Brandt',
  initials: 'LB',
  avatar: '/avatars/avatar-04.svg',
};

export type Source = {
  id: string;
  brand: BrandSlug;
  product: string;
  title: string;
};

export const SOURCES: Source[] = [
  {
    id: 'sheet',
    brand: 'googledrive',
    product: 'Google Drive',
    title: 'Renewals Q3',
  },
  {
    id: 'playbook',
    brand: 'notion',
    product: 'Notion',
    title: 'Renewal playbook',
  },
  {
    id: 'account',
    brand: 'hubspot',
    product: 'HubSpot',
    title: 'Meridian Foods',
  },
];

export const ANSWER =
  'Three accounts are at risk this quarter. Meridian Foods is the biggest: fewer of its people sign in each week since June and its renewal is due on 28 September. Tallis Freight and Okapi Studio follow, both with support tickets left unanswered. I drafted a check-in for Ines Okafor, who owns the Meridian Foods account.';

export const SENT_LINE =
  'Sent to Ines. Her reply will show up in this conversation.';

export const DENIED_LINE =
  'Nothing was sent. The draft stays in Gmail if you want it later.';

export const FOLLOW_UP_REPLY =
  'This demonstration plays one scripted run. Replay it to watch it again.';

export const PLAN: PlanStep[] = [
  { id: 'read', title: 'Read the renewals sheet', status: 'upcoming' },
  { id: 'find', title: 'Find the accounts at risk', status: 'upcoming' },
  { id: 'draft', title: 'Draft the check-in email', status: 'upcoming' },
  { id: 'send', title: 'Send it to the owner', status: 'upcoming' },
];

export const CALL_BRAND: Record<string, BrandSlug> = {
  read_sheet: 'googledrive',
  search_pages: 'notion',
  get_account: 'hubspot',
  send_email: 'gmail',
};

export const EMAIL = {
  to: 'ines.okafor@meridianfoods.example',
  subject: 'A quick check-in before your renewal',
  body: 'Hi Ines, fewer people on your team have signed in lately. Could we find 20 minutes this week to see what would help?',
};

export const SEND_APPROVAL: ApprovalRequest = {
  id: 'send-email',
  title: 'Send this email from your Gmail',
  risk: 'medium',
  status: 'pending',
  detail: EMAIL.subject,
};
