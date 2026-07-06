export type EmojiItem = {
  char: string;
  name: string;
  keywords: string;
};

export type Cell = {
  x: number;
  y: number;
};

export const EMOJI: EmojiItem[] = [
  { char: '\u{1F600}', name: 'Grinning face', keywords: 'happy smile' },
  { char: '\u{1F602}', name: 'Laughing', keywords: 'joy funny tears' },
  { char: '\u{1F60A}', name: 'Smiling face', keywords: 'happy blush' },
  { char: '\u{1F60D}', name: 'Heart eyes', keywords: 'love heart adore' },
  { char: '\u{1F60E}', name: 'Cool', keywords: 'sunglasses' },
  { char: '\u{1F914}', name: 'Thinking', keywords: 'hmm wonder' },
  { char: '\u{1F62E}', name: 'Surprised', keywords: 'wow shock' },
  { char: '\u{1F622}', name: 'Crying', keywords: 'sad tear' },
  { char: '\u{1F634}', name: 'Sleepy', keywords: 'tired zzz' },
  { char: '\u{1F973}', name: 'Partying face', keywords: 'party celebrate' },
  { char: '\u{1F643}', name: 'Upside down face', keywords: 'silly irony' },
  { char: '\u{1F607}', name: 'Angel', keywords: 'innocent halo' },
  { char: '\u{1F44D}', name: 'Thumbs up', keywords: 'yes ok approve' },
  { char: '\u{1F44F}', name: 'Clapping', keywords: 'applause bravo' },
  { char: '\u{1F64C}', name: 'Raised hands', keywords: 'hooray praise' },
  { char: '\u{1F64F}', name: 'Thanks', keywords: 'please pray' },
  { char: '\u{1F440}', name: 'Eyes', keywords: 'look watch' },
  { char: '\u{1F4AA}', name: 'Strong', keywords: 'muscle power' },
  { char: '\u{1F44B}', name: 'Waving hand', keywords: 'hello bye hi' },
  { char: '✌️', name: 'Peace', keywords: 'victory' },
  { char: '❤️', name: 'Red heart', keywords: 'love heart' },
  { char: '\u{1F525}', name: 'Fire', keywords: 'hot lit' },
  { char: '⭐', name: 'Star', keywords: 'favorite' },
  { char: '\u{1F4AF}', name: 'Hundred', keywords: 'perfect score' },
  { char: '✅', name: 'Check', keywords: 'done yes' },
  { char: '❌', name: 'Cross', keywords: 'no wrong' },
  { char: '⚡', name: 'Lightning', keywords: 'fast zap power' },
  { char: '\u{1F4A1}', name: 'Idea', keywords: 'light bulb' },
  { char: '\u{1F3AF}', name: 'Target', keywords: 'goal bullseye' },
  { char: '\u{1F680}', name: 'Rocket', keywords: 'launch ship' },
  { char: '\u{1F389}', name: 'Party popper', keywords: 'tada celebrate party' },
  { char: '\u{1F3C6}', name: 'Trophy', keywords: 'win prize' },
  { char: '\u{1F4C5}', name: 'Calendar', keywords: 'date schedule' },
  { char: '\u{1F4CC}', name: 'Pin', keywords: 'pushpin save' },
  { char: '\u{1F4CE}', name: 'Paperclip', keywords: 'attach' },
  { char: '\u{1F4AC}', name: 'Speech bubble', keywords: 'chat comment' },
  { char: '\u{1F4C8}', name: 'Chart up', keywords: 'growth rise' },
  { char: '\u{1F514}', name: 'Bell', keywords: 'notify alert' },
  { char: '\u{1F512}', name: 'Lock', keywords: 'secure private' },
  { char: '\u{1F6E0}️', name: 'Tools', keywords: 'fix build' },
  { char: '\u{1F4E6}', name: 'Package', keywords: 'box ship delivery' },
  { char: '☕', name: 'Coffee', keywords: 'tea break' },
  { char: '\u{1F355}', name: 'Pizza', keywords: 'food lunch' },
  { char: '\u{1F382}', name: 'Birthday cake', keywords: 'party sweet' },
  { char: '\u{1F30D}', name: 'Earth', keywords: 'world globe africa' },
  { char: '\u{1F31E}', name: 'Sun', keywords: 'bright day' },
  { char: '\u{1F319}', name: 'Moon', keywords: 'night' },
  { char: '\u{1F308}', name: 'Rainbow', keywords: 'colour pride' },
  { char: '\u{1F331}', name: 'Seedling', keywords: 'grow plant' },
  { char: '\u{1F333}', name: 'Tree', keywords: 'nature forest' },
  { char: '\u{1F418}', name: 'Elephant', keywords: 'animal' },
  { char: '\u{1F981}', name: 'Lion', keywords: 'animal brave' },
  { char: '\u{1F422}', name: 'Turtle', keywords: 'slow animal' },
  { char: '✈️', name: 'Plane', keywords: 'travel flight' },
  { char: '\u{1F6B2}', name: 'Bicycle', keywords: 'bike ride' },
  { char: '⚽', name: 'Football', keywords: 'soccer sport' },
  { char: '\u{1F3B5}', name: 'Music', keywords: 'note song' },
  { char: '\u{1F4F7}', name: 'Camera', keywords: 'photo picture' },
  { char: '\u{1F381}', name: 'Gift', keywords: 'present surprise' },
  { char: '\u{1F9E0}', name: 'Brain', keywords: 'smart mind' },
  { char: '\u{1F91D}', name: 'Handshake', keywords: 'deal agree' },
  { char: '\u{1F642}', name: 'Slight smile', keywords: 'calm fine' },
];

export function matchingEmoji(query: string) {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return EMOJI;
  }
  return EMOJI.filter((item) => {
    const haystack = `${item.name} ${item.keywords}`.toLowerCase();
    return haystack.includes(needle);
  });
}

type Axial = {
  q: number;
  r: number;
};

const SIDES: Axial[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

function ringOf(radius: number): Axial[] {
  const cells: Axial[] = [];
  let q = -radius;
  let r = radius;
  for (const side of SIDES) {
    for (let step = 0; step < radius; step += 1) {
      cells.push({ q, r });
      q += side.q;
      r += side.r;
    }
  }
  return cells;
}

function pixelOf(cell: Axial, spacing: number): Cell {
  const rowHeight = (Math.sqrt(3) / 2) * spacing;
  return { x: spacing * (cell.q + cell.r / 2), y: rowHeight * cell.r };
}

export function hexSpiralOf(count: number, spacing: number) {
  const axials: Axial[] = [{ q: 0, r: 0 }];
  for (let radius = 1; axials.length < count; radius += 1) {
    axials.push(...ringOf(radius));
  }
  return axials.slice(0, count).map((cell) => pixelOf(cell, spacing));
}

export function reachOf(cells: Cell[]) {
  const reaches = cells.map((cell) => Math.hypot(cell.x, cell.y));
  return Math.max(0, ...reaches);
}

export function neighborIndexOf(
  cells: Cell[],
  from: number,
  directionX: number,
  directionY: number
) {
  const origin = cells[from];
  let best = -1;
  let bestScore = Infinity;
  cells.forEach((cell, index) => {
    if (index === from) {
      return;
    }
    const dx = cell.x - origin.x;
    const dy = cell.y - origin.y;
    const distance = Math.hypot(dx, dy);
    const alignment = (dx * directionX + dy * directionY) / distance;
    if (alignment < 0.45) {
      return;
    }
    const score = distance * (2 - alignment);
    if (score < bestScore) {
      bestScore = score;
      best = index;
    }
  });
  return best;
}
