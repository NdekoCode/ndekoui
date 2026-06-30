import { LockIcon, NetworkIcon, type Icon } from '@/registry/ndeko/lib/icons';

type ValuePoint = {
  title: string;
  body: string;
  Glyph: Icon;
};

const POINTS: ValuePoint[] = [
  {
    title: 'Works where you already build',
    body: 'One address for every client on this page, from a terminal agent to an app builder. The same tools answer everywhere, so what your agent learns in Cursor holds in Claude.',
    Glyph: NetworkIcon,
  },
  {
    title: 'Read-only: it never changes your project',
    body: 'The server answers with names, source and commands, and holds no key to your files or accounts. Files change only when your agent runs the shadcn command, the same way they would if you ran it.',
    Glyph: LockIcon,
  },
];

export function ValuePoints() {
  return (
    <ul aria-label='Why connect it' className='grid gap-10 md:grid-cols-2'>
      {POINTS.map((point) => {
        const { Glyph } = point;
        return (
          <li
            key={point.title}
            className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1'
          >
            <span className='keycap-3d text-muted-foreground row-span-2 flex size-8 items-center justify-center rounded-lg'>
              <Glyph />
            </span>
            <h2 className='pt-1 text-sm font-medium'>{point.title}</h2>
            <p className='text-muted-foreground text-[13px] leading-relaxed text-pretty'>
              {point.body}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
