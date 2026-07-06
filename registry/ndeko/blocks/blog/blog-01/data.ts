import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import {
  BoxIcon,
  BrushIcon,
  CodeIcon,
  MapPinIcon,
  UsersIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

export type TopicId =
  'engineering' | 'product' | 'design' | 'field' | 'company';

export type Topic = {
  id: TopicId;
  label: string;
  series: SeriesSlot;
};

export type Post = {
  id: string;
  title: string;
  excerpt: string;
  topic: TopicId;
  author: string;
  date: string;
  isoDate: string;
  minutes: number;
  href: string;
};

export const BLOG = {
  company: 'Saltmarsh',
  name: 'Field notes',
  lead: 'What we learn building Saltmarsh, and what surveyors teach us on the way',
  homeHref: '#',
};

export const TOPICS: Topic[] = [
  { id: 'engineering', label: 'Engineering', series: 1 },
  { id: 'product', label: 'Product', series: 2 },
  { id: 'design', label: 'Design', series: 3 },
  { id: 'field', label: 'Field stories', series: 4 },
  { id: 'company', label: 'Company', series: 5 },
];

export const TOPIC_GLYPH: Record<TopicId, Icon> = {
  engineering: CodeIcon,
  product: BoxIcon,
  design: BrushIcon,
  field: MapPinIcon,
  company: UsersIcon,
};

export const POSTS: Post[] = [
  {
    id: 'offline-sync',
    title: 'Offline sync that survives a week without signal',
    excerpt:
      'Surveyors spend days on islands with no network. We rebuilt sync around a log of small changes that merge cleanly when the boat gets back to the harbour.',
    topic: 'engineering',
    author: 'Ines Duarte',
    date: '4 Nov 2026',
    isoDate: '2026-11-04',
    minutes: 9,
    href: '#offline-sync',
  },
  {
    id: 'gloved-picker',
    title: 'A species picker for gloved hands',
    excerpt:
      'Targets twice the usual size, the last five species one tap away, and no gesture that needs two fingers on a cold morning.',
    topic: 'design',
    author: 'Maarten de Vries',
    date: '28 Oct 2026',
    isoDate: '2026-10-28',
    minutes: 6,
    href: '#gloved-picker',
  },
  {
    id: 'photo-pins',
    title: 'Photos that keep their place on the map',
    excerpt:
      'Every photo now carries the point it was taken from, so a quadrat shot in May lines up with the same quadrat in September.',
    topic: 'product',
    author: 'Hannah Okafor',
    date: '21 Oct 2026',
    isoDate: '2026-10-21',
    minutes: 4,
    href: '#photo-pins',
  },
  {
    id: 'curlews',
    title: 'Counting curlews at dawn on the estuary',
    excerpt:
      'A volunteer team logged their winter counts on one shared form. What worked, what the tide got wrong, and what we changed after.',
    topic: 'field',
    author: 'Rhys Morgan',
    date: '14 Oct 2026',
    isoDate: '2026-10-14',
    minutes: 7,
    href: '#curlews',
  },
  {
    id: 'search-on-phone',
    title: 'Why we moved search into the phone',
    excerpt:
      'Looking up a species should not wait for a server. The whole checklist now ships with the app and answers in a few milliseconds.',
    topic: 'engineering',
    author: 'Ines Duarte',
    date: '7 Oct 2026',
    isoDate: '2026-10-07',
    minutes: 8,
    href: '#search-on-phone',
  },
  {
    id: 'shared-forms',
    title: 'Shared survey forms, without the spreadsheet',
    excerpt:
      'Build a form once, send it to the whole team, and see every visit arrive in one table instead of twelve attachments.',
    topic: 'product',
    author: 'Hannah Okafor',
    date: '30 Sep 2026',
    isoDate: '2026-09-30',
    minutes: 5,
    href: '#shared-forms',
  },
  {
    id: 'full-sun',
    title: 'Colours you can read in full sun',
    excerpt:
      'We took the app to a salt flat at noon and changed half the palette. Contrast numbers on a desk do not survive the glare.',
    topic: 'design',
    author: 'Maarten de Vries',
    date: '23 Sep 2026',
    isoDate: '2026-09-23',
    minutes: 5,
    href: '#full-sun',
  },
  {
    id: 'bat-battery',
    title: 'What a bat survey taught us about battery life',
    excerpt:
      'Night transects run for hours with the screen dimmed. We found the three things that drained phones before midnight.',
    topic: 'engineering',
    author: 'Tobias Lind',
    date: '16 Sep 2026',
    isoDate: '2026-09-16',
    minutes: 6,
    href: '#bat-battery',
  },
  {
    id: 'export-format',
    title: 'Exporting to the national records format',
    excerpt:
      'One button now turns a season of visits into a file the records centre accepts, with grid references in the shape they expect.',
    topic: 'product',
    author: 'Hannah Okafor',
    date: '9 Sep 2026',
    isoDate: '2026-09-09',
    minutes: 3,
    href: '#export-format',
  },
  {
    id: 'seabirds',
    title: 'Two seasons on the seabird count',
    excerpt:
      'Cliff ledges, sea fog and a ferry that runs twice a week. A field lead on planning a count around the weather.',
    topic: 'field',
    author: 'Rhys Morgan',
    date: '2 Sep 2026',
    isoDate: '2026-09-02',
    minutes: 8,
    href: '#seabirds',
  },
  {
    id: 'first-year',
    title: 'Our first year as a team of nine',
    excerpt:
      'Why we still answer every support message ourselves, and the two hires we would make again tomorrow.',
    topic: 'company',
    author: 'Clara Benn',
    date: '26 Aug 2026',
    isoDate: '2026-08-26',
    minutes: 4,
    href: '#first-year',
  },
  {
    id: 'boat-testing',
    title: 'Testing the app on a boat, on purpose',
    excerpt:
      'Spray, gloves and a horizon that will not hold still. The test day that now opens every release.',
    topic: 'engineering',
    author: 'Tobias Lind',
    date: '19 Aug 2026',
    isoDate: '2026-08-19',
    minutes: 5,
    href: '#boat-testing',
  },
];

export function topicOf(id: TopicId) {
  const topic = TOPICS.find((candidate) => candidate.id === id);
  return topic ?? TOPICS[0];
}
