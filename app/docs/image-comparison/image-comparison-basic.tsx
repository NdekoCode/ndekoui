import {
  ImageComparison,
  ImageComparisonImage,
  ImageComparisonSlider,
} from '@/components/core/image-comparison';

type Palette = {
  background: string;
  card: string;
  foreground: string;
  mutedForeground: string;
  border: string;
  primary: string;
  primaryForeground: string;
};

const LIGHT_TOKENS: Palette = {
  background: 'hsl(240 11% 98%)',
  card: 'hsl(0 0% 100%)',
  foreground: 'hsl(240 6% 10%)',
  mutedForeground: 'hsl(240 4% 42%)',
  border: 'hsl(240 3% 89%)',
  primary: 'hsl(239 84% 67%)',
  primaryForeground: 'hsl(0 0% 100%)',
};

const DARK_TOKENS: Palette = {
  background: 'hsl(240 5% 7%)',
  card: 'hsl(240 5% 10%)',
  foreground: 'hsl(240 5% 90%)',
  mutedForeground: 'hsl(240 5% 62%)',
  border: 'hsl(240 4% 16%)',
  primary: 'hsl(239 84% 67%)',
  primaryForeground: 'hsl(0 0% 100%)',
};

const NAV_ITEMS = ['Inbox', 'Boards', 'Reports', 'Members'];

const STATS = [
  { label: 'Tasks done', value: '132' },
  { label: 'Hours logged', value: '318' },
  { label: 'On time', value: '94%' },
];

const BAR_HEIGHTS = [180, 240, 150, 280, 220, 300, 200];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function drawNav(palette: Palette) {
  return NAV_ITEMS.map((item, index) => {
    const y = 200 + index * 64;
    return `<text x='64' y='${y}' font-size='26' fill='${palette.mutedForeground}'>${item}</text>`;
  }).join('');
}

function drawStats(palette: Palette) {
  return STATS.map((stat, index) => {
    const x = 400 + index * 380;
    const textX = x + 36;
    const card = `<rect x='${x}' y='230' width='340' height='200' rx='24' fill='${palette.card}' stroke='${palette.border}' stroke-width='2'/>`;
    const label = `<text x='${textX}' y='296' font-size='24' fill='${palette.mutedForeground}'>${stat.label}</text>`;
    const value = `<text x='${textX}' y='380' font-size='64' font-weight='600' fill='${palette.foreground}'>${stat.value}</text>`;
    return card + label + value;
  }).join('');
}

function drawChart(palette: Palette) {
  const bars = BAR_HEIGHTS.map((height, index) => {
    const x = 470 + index * 150;
    const y = 850 - height;
    return `<rect x='${x}' y='${y}' width='64' height='${height}' rx='14' fill='${palette.primary}'/>`;
  }).join('');
  const labels = DAYS.map((day, index) => {
    const x = 502 + index * 150;
    return `<text x='${x}' y='892' font-size='22' text-anchor='middle' fill='${palette.mutedForeground}'>${day}</text>`;
  }).join('');
  const frame = `<rect x='400' y='470' width='1100' height='460' rx='24' fill='${palette.card}' stroke='${palette.border}' stroke-width='2'/>`;
  return frame + bars + labels;
}

function drawWorkspace(palette: Palette) {
  const svg = [
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000' font-family='system-ui, sans-serif'>`,
    `<rect width='1600' height='1000' fill='${palette.background}'/>`,
    `<rect width='320' height='1000' fill='${palette.card}'/>`,
    `<rect x='320' width='2' height='1000' fill='${palette.border}'/>`,
    `<circle cx='76' cy='92' r='18' fill='${palette.foreground}'/>`,
    `<text x='108' y='102' font-size='30' font-weight='600' fill='${palette.foreground}'>Tidewell</text>`,
    drawNav(palette),
    `<text x='400' y='130' font-size='46' font-weight='600' fill='${palette.foreground}'>Weekly report</text>`,
    `<text x='400' y='178' font-size='26' fill='${palette.mutedForeground}'>12 to 18 May</text>`,
    `<rect x='1280' y='88' width='220' height='64' rx='32' fill='${palette.primary}'/>`,
    `<text x='1390' y='129' font-size='24' font-weight='500' text-anchor='middle' fill='${palette.primaryForeground}'>Share report</text>`,
    drawStats(palette),
    drawChart(palette),
    `</svg>`,
  ].join('');
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

const DARK_WORKSPACE = drawWorkspace(DARK_TOKENS);

const LIGHT_WORKSPACE = drawWorkspace(LIGHT_TOKENS);

export function ImageComparisonBasic() {
  return (
    <ImageComparison className='hairline-ring ring-border aspect-16/10 w-full rounded-xl'>
      <ImageComparisonImage
        src={DARK_WORKSPACE}
        alt='Tidewell weekly report in the dark theme'
        position='left'
      />
      <ImageComparisonImage
        src={LIGHT_WORKSPACE}
        alt='Tidewell weekly report in the light theme'
        position='right'
      />
      <ImageComparisonSlider className='bg-primary' />
    </ImageComparison>
  );
}
