import { Highlighter } from '@/components/core/highlighter';

export function HighlighterMultiline() {
  return (
    <p className='text-foreground max-w-[260px] text-base leading-relaxed'>
      Before you merge,{' '}
      <Highlighter tone='primary' duration={1.4}>
        check that every screen still reads well in the dark theme and at the
        smallest phone width
      </Highlighter>
      .
    </p>
  );
}
