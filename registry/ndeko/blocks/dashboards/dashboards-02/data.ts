export type WeekId = 'w43' | 'w44' | 'w45';

export type MemberId = 'amara' | 'lucas' | 'priya' | 'mateo' | 'jonas';

export type ProjectId =
  'harbor' | 'billing' | 'design' | 'support' | 'research' | 'hiring';

export type WeekDay = {
  name: string;
  short: string;
  date: number;
  month: string;
};

export type Week = {
  id: WeekId;
  number: number;
  rangeLabel: string;
  days: WeekDay[];
  /** Index of today in `days`, or null when the week is over. Days after it are ahead. */
  todayIndex: number | null;
};

export type Member = {
  id: MemberId;
  name: string;
};

export type Project = { id: ProjectId; name: string };

export type ProjectShare = { projectId: ProjectId; share: number };

export type MemberWeek = {
  /** Minutes tracked from Monday to Sunday. */
  days: number[];
  mix: ProjectShare[];
};

export const TEAM_NAME = 'Product team';

const DAY_NAMES = [
  { name: 'Monday', short: 'Mon' },
  { name: 'Tuesday', short: 'Tue' },
  { name: 'Wednesday', short: 'Wed' },
  { name: 'Thursday', short: 'Thu' },
  { name: 'Friday', short: 'Fri' },
  { name: 'Saturday', short: 'Sat' },
  { name: 'Sunday', short: 'Sun' },
];

/** The seven days of a week that stays inside one month. */
function weekDays(month: string, firstDate: number): WeekDay[] {
  return DAY_NAMES.map((day, index) => {
    const date = firstDate + index;
    return { name: day.name, short: day.short, date, month };
  });
}

export const WEEKS: Week[] = [
  {
    id: 'w43',
    number: 43,
    rangeLabel: '19 to 25 October 2026',
    days: weekDays('October', 19),
    todayIndex: null,
  },
  {
    id: 'w44',
    number: 44,
    rangeLabel: '26 October to 1 November 2026',
    days: [
      { name: 'Monday', short: 'Mon', date: 26, month: 'October' },
      { name: 'Tuesday', short: 'Tue', date: 27, month: 'October' },
      { name: 'Wednesday', short: 'Wed', date: 28, month: 'October' },
      { name: 'Thursday', short: 'Thu', date: 29, month: 'October' },
      { name: 'Friday', short: 'Fri', date: 30, month: 'October' },
      { name: 'Saturday', short: 'Sat', date: 31, month: 'October' },
      { name: 'Sunday', short: 'Sun', date: 1, month: 'November' },
    ],
    todayIndex: null,
  },
  {
    id: 'w45',
    number: 45,
    rangeLabel: '2 to 8 November 2026',
    days: weekDays('November', 2),
    todayIndex: 3,
  },
];

export const MEMBERS: Member[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
  },
  {
    id: 'lucas',
    name: 'Lucas Moreau',
  },
  {
    id: 'priya',
    name: 'Priya Raman',
  },
  {
    id: 'mateo',
    name: 'Mateo Silva',
  },
  { id: 'jonas', name: 'Jonas Weber' },
];

export const PROJECTS: Project[] = [
  { id: 'harbor', name: 'Harbor mobile app' },
  { id: 'billing', name: 'Billing revamp' },
  { id: 'design', name: 'Design system' },
  { id: 'support', name: 'Support rotation' },
  { id: 'research', name: 'Customer interviews' },
  { id: 'hiring', name: 'Hiring loop' },
];

export const MEMBER_WEEKS: Record<MemberId, Record<WeekId, MemberWeek>> = {
  amara: {
    w43: {
      days: [450, 480, 420, 510, 390, 0, 0],
      mix: [
        { projectId: 'harbor', share: 0.45 },
        { projectId: 'design', share: 0.35 },
        { projectId: 'research', share: 0.2 },
      ],
    },
    w44: {
      days: [465, 500, 480, 455, 420, 0, 0],
      mix: [
        { projectId: 'harbor', share: 0.5 },
        { projectId: 'design', share: 0.3 },
        { projectId: 'research', share: 0.2 },
      ],
    },
    w45: {
      days: [470, 455, 490, 245, 0, 0, 0],
      mix: [
        { projectId: 'harbor', share: 0.55 },
        { projectId: 'design', share: 0.3 },
        { projectId: 'hiring', share: 0.15 },
      ],
    },
  },
  lucas: {
    w43: {
      days: [480, 465, 500, 440, 360, 60, 0],
      mix: [
        { projectId: 'billing', share: 0.4 },
        { projectId: 'harbor', share: 0.3 },
        { projectId: 'hiring', share: 0.2 },
        { projectId: 'support', share: 0.1 },
      ],
    },
    w44: {
      days: [500, 470, 485, 510, 390, 0, 0],
      mix: [
        { projectId: 'billing', share: 0.45 },
        { projectId: 'harbor', share: 0.3 },
        { projectId: 'hiring', share: 0.15 },
        { projectId: 'support', share: 0.1 },
      ],
    },
    w45: {
      days: [485, 500, 470, 260, 0, 0, 0],
      mix: [
        { projectId: 'billing', share: 0.5 },
        { projectId: 'harbor', share: 0.25 },
        { projectId: 'hiring', share: 0.25 },
      ],
    },
  },
  priya: {
    w43: {
      days: [420, 450, 435, 480, 405, 0, 0],
      mix: [
        { projectId: 'harbor', share: 0.6 },
        { projectId: 'design', share: 0.4 },
      ],
    },
    w44: {
      days: [440, 470, 455, 0, 0, 0, 0],
      mix: [
        { projectId: 'harbor', share: 0.7 },
        { projectId: 'design', share: 0.3 },
      ],
    },
    w45: {
      days: [450, 465, 480, 230, 0, 0, 0],
      mix: [
        { projectId: 'harbor', share: 0.65 },
        { projectId: 'design', share: 0.25 },
        { projectId: 'support', share: 0.1 },
      ],
    },
  },
  mateo: {
    w43: {
      days: [390, 410, 0, 455, 430, 0, 0],
      mix: [
        { projectId: 'billing', share: 0.7 },
        { projectId: 'support', share: 0.3 },
      ],
    },
    w44: {
      days: [420, 445, 430, 460, 410, 90, 0],
      mix: [
        { projectId: 'billing', share: 0.6 },
        { projectId: 'support', share: 0.25 },
        { projectId: 'harbor', share: 0.15 },
      ],
    },
    w45: {
      days: [430, 410, 445, 215, 0, 0, 0],
      mix: [
        { projectId: 'billing', share: 0.75 },
        { projectId: 'support', share: 0.25 },
      ],
    },
  },
  jonas: {
    w43: {
      days: [400, 420, 410, 380, 300, 0, 0],
      mix: [
        { projectId: 'harbor', share: 0.5 },
        { projectId: 'billing', share: 0.3 },
        { projectId: 'support', share: 0.2 },
      ],
    },
    w44: {
      days: [380, 410, 395, 420, 280, 0, 0],
      mix: [
        { projectId: 'harbor', share: 0.55 },
        { projectId: 'billing', share: 0.35 },
        { projectId: 'support', share: 0.1 },
      ],
    },
    w45: {
      days: [0, 0, 0, 0, 0, 0, 0],
      mix: [],
    },
  },
};
