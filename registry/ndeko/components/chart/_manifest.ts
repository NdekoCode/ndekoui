import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'chart-01',
    source: 'ndeko',
    title: 'Line chart',
    description:
      'One to three lines with a legend that takes a series off, a period switch and a readout on hover or the arrow keys, where the lines glide into the next period under a crosshair that walks them.',
  },
  {
    name: 'chart-02',
    source: 'ndeko',
    title: 'Bar chart',
    description:
      'Bars side by side or stacked from a zero baseline, lying down when the room is narrow, with a readout on each bar, where every bar slides to its place when the arrangement changes.',
  },
  {
    name: 'chart-03',
    source: 'ndeko',
    title: 'Area chart and sparklines',
    description:
      'Four stat tiles, each with a sparkline, an end dot and its change in words, over an area chart that glides into the curve of the tile you pick.',
  },
  {
    name: 'chart-04',
    source: 'ndeko',
    title: 'Baseline chart',
    description:
      'A daily metric against any day you click: the level line glides there, the curve prints in the primary colour above it and in red below, and the sentence on top reads again from that day.',
  },
  {
    name: 'chart-05',
    source: 'ndeko',
    title: 'Outlook chart',
    description:
      'What happened as a solid line and what might happen as a band that thins as it runs out, with a confidence switch that widens and narrows the band and a readout that gives the likely range in words.',
  },
  {
    name: 'chart-06',
    source: 'ndeko',
    title: 'Goal numerals',
    description:
      'Four goals as soft bars under large percentages and a month scrubber that moves them all as one, where a bar that reaches its goal gives a little, then breaks through in amber with the words Over goal.',
  },
  {
    name: 'chart-07',
    source: 'ndeko',
    title: 'Metric explainer',
    description:
      'A figure with its change in words, a reading of why it moved that streams in when asked, and its drivers as bars around zero, where pointing at a driver lights its share of the total.',
  },
  {
    name: 'chart-08',
    source: 'ndeko',
    title: 'Shift',
    description:
      'Where visitors come from as a list, as bars or as change, where switching view makes every icon, figure and bar glide to its new place instead of being drawn again.',
  },
  {
    name: 'chart-09',
    source: 'ndeko',
    title: 'Uptime bar',
    description:
      'One bar per day for a service, up, degraded, down or without data, with its uptime, a readout that glides along the days on hover or the arrow keys, and Enter to keep the details of a day open; the bars thin out from ninety days to thirty as the piece narrows.',
  },
  {
    name: 'chart-10',
    source: 'ndeko',
    title: 'Dot histogram',
    description:
      'A distribution stacked from dots with a target pin you drag, flick or move with the arrow keys, where the pin catches on each column and the dots past it turn red one column after the other while the sentence on top counts them.',
  },
  {
    name: 'chart-11',
    source: 'ndeko',
    title: 'Lasso scatter',
    description:
      'Every request a dot, coloured by model: a lasso drawn round a cluster fades the rest and the headline counts what it holds, its average and the model most of it belongs to; a model button selects the same way from the keyboard.',
  },
  {
    name: 'chart-12',
    source: 'ndeko',
    title: 'Matchup',
    description:
      'Two contenders compared on six criteria as one shape made of petals, each as long as the lead and in the colour of whoever leads there, with a sentence that names the leads and petals that reshape when a contender changes.',
  },
  {
    name: 'chart-13',
    source: 'ndeko',
    title: 'Flow funnel',
    description:
      'A funnel drawn as one smooth shape whose edges you pull, by hand or with the arrow keys, to try a better rate: everything downstream swells with it, the headline counts the customers gained, and the edge catches on the real rate on the way back.',
  },
  {
    name: 'chart-14',
    source: 'ndeko',
    title: 'Bridge',
    description:
      'A waterfall from last month to this month that you pour by dragging across it or with the arrow keys: each floating bar fills as the pour reaches it and the running total rolls step by step.',
  },
  {
    name: 'chart-15',
    source: 'ndeko',
    title: 'Ask your data',
    description:
      'A question typed or picked from suggestions gets a one-line answer that streams over a chart where only the series it talks about is in colour, and a follow-up reshapes the same chart, its lines gliding into the new series, while past questions stay as chips to go back to.',
  },
  {
    name: 'chart-16',
    source: 'ndeko',
    title: 'Forecast what-if',
    description:
      'Cash runway against the plan with a what-if typed in plain words that bends the forecast away from the plan as the runway rolls, where switching to Range fans the line out into a swarm of likely futures and the runway mark parts into a range.',
  },
];
