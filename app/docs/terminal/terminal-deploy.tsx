import { Terminal, type TerminalLine } from '@/components/core/terminal';

const DEPLOY: TerminalLine[] = [
  { kind: 'command', text: 'pnpm build' },
  { kind: 'output', text: 'Compiled in 4.2s', tone: 'muted', delay: 700 },
  { kind: 'output', text: 'Generated 38 static pages', tone: 'muted' },
  { kind: 'command', text: 'harbor deploy --prod' },
  { kind: 'output', text: 'Uploading 214 files', tone: 'muted', delay: 900 },
  {
    kind: 'output',
    text: '2 images are larger than 1 MB',
    tone: 'warning',
  },
  {
    kind: 'output',
    text: 'Live at https://field-notes.example.com',
    tone: 'success',
  },
];

export function TerminalDeploy() {
  return (
    <div className='w-full max-w-xl px-4'>
      <Terminal title='Deploy log' prompt='~/field-notes $' lines={DEPLOY} />
    </div>
  );
}
