export type ArticleBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'quote'; text: string; person: string; role: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'code'; code: string; caption: string };

export type Section = {
  id: string;
  title: string;
  blocks: ArticleBlock[];
};

export type Neighbour = {
  title: string;
  href: string;
};

export type Related = {
  id: string;
  title: string;
  topic: string;
  date: string;
  minutes: number;
  href: string;
};

export const BLOG = {
  company: 'Saltmarsh',
  blogHref: '#blog',
  topicHref: '#blog-engineering',
};

export const POST = {
  title: 'Offline sync that survives a week without signal',
  lead: 'Surveyors spend days on islands with no network. We rebuilt sync around a log of small changes that merge cleanly when the boat gets back to the harbour.',
  topic: 'Engineering',
  author: 'Ines Duarte',
  role: 'Engineer, sync and storage',
  date: '4 Nov 2026',
  isoDate: '2026-11-04',
  minutes: 9,
  link: 'https://saltmarsh.example/blog/offline-sync',
};

export const SECTIONS: Section[] = [
  {
    id: 'week-offline',
    title: 'A week without signal',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Most of the people who use Saltmarsh count things in places phones were not built for: salt marsh, sea cliffs, upland bog. A seabird team on a small island can go six days without a bar of signal, then sync everything from the ferry on the way home.',
      },
      {
        kind: 'paragraph',
        text: 'Our first sync engine sent whole records. When two people edited the same quadrat while offline, the last phone to reach a network won, and the other visit quietly disappeared. Nobody noticed until the season report.',
      },
      {
        kind: 'quote',
        text: 'We carried a paper notebook as well, because one of the phones always lost the last day.',
        person: 'Rhys Morgan',
        role: 'Field lead on the estuary count',
      },
    ],
  },
  {
    id: 'small-changes',
    title: 'A log of small changes',
    blocks: [
      {
        kind: 'paragraph',
        text: 'We stopped sending records and started sending what happened to them. Every tap that changes data becomes one small entry: set the count of curlews to 14, attach this photo, move this point two metres north.',
      },
      {
        kind: 'code',
        code: '{\n  "device": "phone-7f2",\n  "seq": 4182,\n  "record": "visit/dee-14",\n  "set": { "curlew": 14 }\n}',
        caption: 'One entry of the log, as the phone writes it',
      },
      {
        kind: 'paragraph',
        text: 'Entries carry the phone that wrote them and a counter that only goes up. They are written to the phone first and never edited afterwards, so a crash in the middle of a count loses at most the entry being written.',
      },
    ],
  },
  {
    id: 'merging',
    title: 'Merging when the boat gets back',
    blocks: [
      {
        kind: 'paragraph',
        text: 'When a phone finds a network it sends every entry the server has not seen, in order, and the server replays them on top of what it already holds. Two entries that touch different fields both land, which covers almost every case we saw in a season.',
      },
      {
        kind: 'list',
        items: [
          'Different fields: both changes are kept',
          'Same field and same value: there is nothing to decide',
          'Same field, different values: the field lead picks one, and nothing is thrown away',
        ],
      },
      {
        kind: 'paragraph',
        text: 'When two entries change the same field, the record is flagged instead of overwritten. The field lead sees both values side by side, with the names of the two people who entered them, and keeps one.',
      },
    ],
  },
  {
    id: 'replayed',
    title: 'Replaying last season',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Before shipping, we replayed the logs of last season through the new engine. Every visit the old engine had overwritten came back, with its conflict flagged for a person to settle.',
      },
      {
        kind: 'paragraph',
        text: 'The log is also smaller than the records were. A day of counting is a few hundred entries of a few dozen bytes each, so even a weak signal on the ferry is enough to send a week.',
      },
    ],
  },
  {
    id: 'rollout',
    title: 'Rolling it out',
    blocks: [
      {
        kind: 'paragraph',
        text: 'The new engine ran beside the old one for a month, writing the log without using it. Once both agreed on every record for two weeks, we moved teams over one region at a time, starting with the ones that spend the longest offline.',
      },
      {
        kind: 'paragraph',
        text: 'If you lead a team, there is nothing to do: the next update moves your phones to the log. Conflicts appear in the review tab of each survey, with a dot on the tab while one waits for you.',
      },
    ],
  },
];

export const PREVIOUS: Neighbour = {
  title: 'A species picker for gloved hands',
  href: '#gloved-picker',
};

export const NEXT: Neighbour = {
  title: 'Planning the winter counts with three teams',
  href: '#winter-counts',
};

export const RELATED: Related[] = [
  {
    id: 'search-on-phone',
    title: 'Why we moved search into the phone',
    topic: 'Engineering',
    date: '7 Oct 2026',
    minutes: 8,
    href: '#search-on-phone',
  },
  {
    id: 'bat-battery',
    title: 'What a bat survey taught us about battery life',
    topic: 'Engineering',
    date: '16 Sep 2026',
    minutes: 6,
    href: '#bat-battery',
  },
  {
    id: 'photo-pins',
    title: 'Photos that keep their place on the map',
    topic: 'Product',
    date: '21 Oct 2026',
    minutes: 4,
    href: '#photo-pins',
  },
];
