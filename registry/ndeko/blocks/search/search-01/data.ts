import {
  BookOpenIcon,
  CodeIcon,
  HistoryIcon,
  MessageCircleIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

export type PageType = 'guide' | 'api' | 'changelog' | 'community';

export type IndexedPage = {
  id: string;
  type: PageType;
  title: string;
  trail: string[];
  excerpt: string;
  href: string;
};

export const SITE = {
  name: 'Tideway',
  homeHref: '#',
};

export const TYPES: { id: PageType; label: string }[] = [
  { id: 'guide', label: 'Guides' },
  { id: 'api', label: 'API reference' },
  { id: 'changelog', label: 'Changelog' },
  { id: 'community', label: 'Community' },
];

export const TYPE_GLYPH: Record<PageType, Icon> = {
  guide: BookOpenIcon,
  api: CodeIcon,
  changelog: HistoryIcon,
  community: MessageCircleIcon,
};

export const POPULAR_SEARCHES = [
  'signature',
  'retry',
  'rate limits',
  'idempotency',
];

export const PAGES: IndexedPage[] = [
  {
    id: 'verify-signatures',
    type: 'guide',
    title: 'Verify webhook signatures',
    trail: ['Docs', 'Webhooks'],
    excerpt:
      'Every delivery carries a Tideway-Signature header. Compute the HMAC of the raw body with your signing secret and compare the two in constant time.',
    href: '#verify-webhook-signatures',
  },
  {
    id: 'rotate-secret',
    type: 'guide',
    title: 'Rotate a signing secret',
    trail: ['Docs', 'Webhooks'],
    excerpt:
      'Create a second secret, accept both for a day, then remove the old one. Deliveries are signed with every active secret during the overlap.',
    href: '#rotate-a-signing-secret',
  },
  {
    id: 'retry-failed',
    type: 'guide',
    title: 'Retry failed deliveries',
    trail: ['Docs', 'Webhooks'],
    excerpt:
      'Failed deliveries are retried for three days with a growing delay. You can also resend one by hand from the event log.',
    href: '#retry-failed-deliveries',
  },
  {
    id: 'behind-firewall',
    type: 'guide',
    title: 'Receive webhooks behind a firewall',
    trail: ['Docs', 'Webhooks'],
    excerpt:
      'Allow the delivery addresses listed in your dashboard, or pull events from the events endpoint instead of receiving them.',
    href: '#receive-webhooks-behind-a-firewall',
  },
  {
    id: 'first-event',
    type: 'guide',
    title: 'Send your first event',
    trail: ['Docs', 'Getting started'],
    excerpt:
      'Create an API key, post an event with curl, and watch it arrive on the test endpoint in the dashboard.',
    href: '#send-your-first-event',
  },
  {
    id: 'idempotency-keys',
    type: 'guide',
    title: 'Idempotency keys',
    trail: ['Docs', 'Concepts'],
    excerpt:
      'Send the same key with a repeated request and Tideway returns the first result instead of creating the event twice.',
    href: '#idempotency-keys',
  },
  {
    id: 'test-locally',
    type: 'guide',
    title: 'Test webhooks on your machine',
    trail: ['Docs', 'Webhooks'],
    excerpt:
      'Forward deliveries to localhost with the command line tool and replay any past event while you work on your handler.',
    href: '#test-webhooks-locally',
  },
  {
    id: 'rate-limits',
    type: 'guide',
    title: 'Rate limits',
    trail: ['Docs', 'Concepts'],
    excerpt:
      'Each key can send 100 requests per second. Responses carry the remaining budget, so a client can slow down before it is refused.',
    href: '#rate-limits',
  },
  {
    id: 'signature-header',
    type: 'api',
    title: 'Signature header',
    trail: ['API reference', 'Headers'],
    excerpt:
      'Tideway-Signature holds a timestamp and one signature per active secret, separated by commas.',
    href: '#signature-header',
  },
  {
    id: 'create-event',
    type: 'api',
    title: 'POST /v1/events',
    trail: ['API reference', 'Events'],
    excerpt:
      'Creates an event and queues a delivery to every endpoint subscribed to its type.',
    href: '#post-v1-events',
  },
  {
    id: 'list-events',
    type: 'api',
    title: 'GET /v1/events',
    trail: ['API reference', 'Events'],
    excerpt:
      'Lists events from newest to oldest, 50 at a time, with a cursor for the next page.',
    href: '#get-v1-events',
  },
  {
    id: 'retry-delivery',
    type: 'api',
    title: 'POST /v1/deliveries/{id}/retry',
    trail: ['API reference', 'Deliveries'],
    excerpt:
      'Queues one more attempt for a failed delivery, outside the automatic retry schedule.',
    href: '#post-v1-deliveries-retry',
  },
  {
    id: 'endpoint-object',
    type: 'api',
    title: 'The endpoint object',
    trail: ['API reference', 'Endpoints'],
    excerpt:
      'An endpoint has an address, the event types it receives and the secrets used to sign its deliveries.',
    href: '#endpoint-object',
  },
  {
    id: 'errors',
    type: 'api',
    title: 'Errors',
    trail: ['API reference'],
    excerpt:
      'Errors return a code, a message written for people and the id of the request to quote to support.',
    href: '#errors',
  },
  {
    id: 'timestamped-signatures',
    type: 'changelog',
    title: 'Signatures include a timestamp',
    trail: ['Changelog', '2026'],
    excerpt:
      'Signatures now cover the time of delivery, so a replayed request older than five minutes can be refused.',
    href: '#changelog-timestamped-signatures',
  },
  {
    id: 'three-day-retries',
    type: 'changelog',
    title: 'Retry schedule extended to three days',
    trail: ['Changelog', '2026'],
    excerpt:
      'Failed deliveries are now retried for three days instead of one, with the same growing delay.',
    href: '#changelog-three-day-retries',
  },
  {
    id: 'event-log',
    type: 'changelog',
    title: 'The event log keeps 30 days',
    trail: ['Changelog', '2026'],
    excerpt:
      'The event log now keeps 30 days of events on every plan, up from 7.',
    href: '#changelog-event-log',
  },
  {
    id: 'listen-command',
    type: 'changelog',
    title: 'New command: tideway listen',
    trail: ['Changelog', '2025'],
    excerpt:
      'tideway listen forwards deliveries to a local address and prints each one as it arrives.',
    href: '#changelog-listen-command',
  },
  {
    id: 'proxy-signature',
    type: 'community',
    title: 'Signature check fails behind a proxy',
    trail: ['Community', 'Webhooks'],
    excerpt:
      'Our proxy re-encoded the body before it reached the handler, so the signature never matched. Reading the raw body fixed it.',
    href: '#community-proxy-signature',
  },
  {
    id: 'out-of-order',
    type: 'community',
    title: 'Retries arriving out of order',
    trail: ['Community', 'Webhooks'],
    excerpt:
      'A retried delivery can arrive after a newer one. Store the time of the event and ignore anything older than what you have.',
    href: '#community-out-of-order',
  },
  {
    id: 'keys-with-queues',
    type: 'community',
    title: 'Idempotency keys with a job queue',
    trail: ['Community', 'Patterns'],
    excerpt:
      'We derive the key from the job id, so a job that runs twice never creates two events.',
    href: '#community-keys-with-queues',
  },
  {
    id: 'handler-timeout',
    type: 'community',
    title: 'Webhook handler times out',
    trail: ['Community', 'Webhooks'],
    excerpt:
      'Answer within ten seconds and do the slow work afterwards: a slow answer counts as a failed delivery.',
    href: '#community-handler-timeout',
  },
];
