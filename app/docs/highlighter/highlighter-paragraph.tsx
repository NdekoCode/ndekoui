import { Highlighter } from '@/components/core/highlighter';

export function HighlighterParagraph() {
  return (
    <p className='text-foreground max-w-md text-base leading-relaxed text-pretty'>
      The weekly digest collects{' '}
      <Highlighter>every decision made in review</Highlighter>, so the people
      who missed the meeting can{' '}
      <Highlighter action='underline' delay={0.6}>
        catch up in five minutes
      </Highlighter>
      .
    </p>
  );
}
