import { Terminal, type TerminalLine } from '@/components/core/terminal';

const INSTALL: TerminalLine[] = [
  {
    kind: 'command',
    text: 'npx shadcn@latest add https://ui.ndekocode.dev/r/motion-marquee.json',
  },
  { kind: 'output', text: 'Checking registry', tone: 'muted', delay: 500 },
  {
    kind: 'output',
    text: 'Installing dependencies',
    tone: 'muted',
    delay: 900,
  },
  { kind: 'output', text: 'Created 1 file', tone: 'success' },
  { kind: 'output', text: '  components/motion/marquee.tsx', tone: 'muted' },
];

export function TerminalInstall() {
  return (
    <div className='w-full max-w-xl px-4'>
      <Terminal title='Install' lines={INSTALL} />
    </div>
  );
}
