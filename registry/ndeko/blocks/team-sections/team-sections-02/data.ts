export type SocialKind = 'linkedin' | 'x' | 'github';

export type Social = {
  kind: SocialKind;
  href: string;
};

export type Member = {
  id: string;
  name: string;
  role: string;
  location: string;
  bio: string;
  socials: Social[];
};

export type Group = {
  id: string;
  name: string;
  members: Member[];
};

export const SECTION = {
  label: 'Team',
  title: 'Who builds Fieldnote',
  lead: 'Seven people across three teams. Open a name to read what they work on and how to reach them.',
};

/** Invented people. */
export const GROUPS: Group[] = [
  {
    id: 'product',
    name: 'Product',
    members: [
      {
        id: 'hanna',
        name: 'Hanna Virtanen',
        role: 'Co-founder, product',
        location: 'Helsinki',
        bio: 'Hanna ran research interviews for six years and lost count of the notes she never read again. She decides what Fieldnote writes down and, just as often, what it leaves out.',
        socials: [
          { kind: 'linkedin', href: '#' },
          { kind: 'x', href: '#' },
        ],
      },
      {
        id: 'diego',
        name: 'Diego Álvarez',
        role: 'Product designer',
        location: 'Valencia',
        bio: 'Diego designs the summary page people open after every call. He reads a hundred real summaries a week, with permission, and redraws the page whenever people skip the same part of it.',
        socials: [{ kind: 'linkedin', href: '#' }],
      },
    ],
  },
  {
    id: 'engineering',
    name: 'Engineering',
    members: [
      {
        id: 'ayesha',
        name: 'Ayesha Siddiqui',
        role: 'Co-founder, engineering',
        location: 'Toronto',
        bio: 'Ayesha built the pipeline that turns a call into a transcript and a transcript into decisions. She is the reason a recording is deleted the moment its summary is approved.',
        socials: [
          { kind: 'github', href: '#' },
          { kind: 'linkedin', href: '#' },
        ],
      },
      {
        id: 'ben',
        name: 'Ben Kalala',
        role: 'Speech recognition engineer',
        location: 'Kinshasa',
        bio: 'Ben tunes how Fieldnote hears accents, crosstalk and bad microphones, in French and Lingala as much as in English. He keeps a library of the hardest calls customers agreed to share and replays all of them before every release.',
        socials: [
          { kind: 'github', href: '#' },
          { kind: 'x', href: '#' },
        ],
      },
      {
        id: 'yuki',
        name: 'Yuki Sato',
        role: 'Frontend engineer',
        location: 'Osaka',
        bio: 'Yuki builds the editor where people fix a summary before it is shared. Every shortcut in it exists because someone asked for it twice in support.',
        socials: [{ kind: 'github', href: '#' }],
      },
    ],
  },
  {
    id: 'customers',
    name: 'Customers',
    members: [
      {
        id: 'rosa',
        name: 'Rosa Delgado',
        role: 'Customer support lead',
        location: 'Buenos Aires',
        bio: 'Rosa answers support in Spanish, Portuguese and English, and writes down every question that took more than one reply. Those questions become the next week’s fixes.',
        socials: [{ kind: 'linkedin', href: '#' }],
      },
      {
        id: 'liam',
        name: 'Liam O’Connor',
        role: 'Solutions engineer',
        location: 'Dublin',
        bio: 'Liam helps larger teams connect Fieldnote to their calendars and their wikis. He has sat in on more onboarding calls than anyone here and still takes his own notes by hand.',
        socials: [
          { kind: 'linkedin', href: '#' },
          { kind: 'x', href: '#' },
        ],
      },
    ],
  },
];
