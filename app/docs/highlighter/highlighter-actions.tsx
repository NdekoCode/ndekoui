import {
  Highlighter,
  type HighlighterAction,
  type HighlighterTone,
} from '@/components/core/highlighter';

type Sample = {
  action: HighlighterAction;
  tone: HighlighterTone;
  text: string;
};

const SAMPLES: Sample[] = [
  { action: 'highlight', tone: 'warning', text: 'Due on Friday' },
  { action: 'underline', tone: 'primary', text: 'Read before the call' },
  { action: 'box', tone: 'info', text: 'Two seats left' },
  { action: 'circle', tone: 'success', text: 'Approved' },
  { action: 'strike', tone: 'destructive', text: 'Draft pricing' },
];

const STEP_DELAY = 0.2;

export function HighlighterActions() {
  return (
    <ul className='flex flex-col items-start gap-6 text-base'>
      {SAMPLES.map((sample, index) => (
        <li key={sample.action} className='flex items-baseline gap-4'>
          <span className='text-muted-foreground w-20 font-mono text-xs'>
            {sample.action}
          </span>
          <Highlighter
            action={sample.action}
            tone={sample.tone}
            delay={index * STEP_DELAY}
          >
            {sample.text}
          </Highlighter>
        </li>
      ))}
    </ul>
  );
}
