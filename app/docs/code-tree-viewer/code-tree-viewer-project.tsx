import {
  CodeTreeViewer,
  type CodeTreeFile,
} from '@/components/core/code-tree-viewer';

const FILES: CodeTreeFile[] = [
  {
    path: 'src/app/page.tsx',
    code: `import { NoteCard } from '@/components/note-card';
import { formatDay } from '@/lib/format-day';

const NOTES = [
  { id: 'n1', title: 'Harbour walk', writtenOn: '2026-10-12' },
  { id: 'n2', title: 'Market list', writtenOn: '2026-10-14' },
];

export default function Page() {
  return (
    <main className="mx-auto max-w-xl p-6">
      {NOTES.map((note) => (
        <NoteCard
          key={note.id}
          title={note.title}
          day={formatDay(note.writtenOn)}
        />
      ))}
    </main>
  );
}`,
  },
  {
    path: 'src/components/note-card.tsx',
    code: `type NoteCardProps = {
  title: string;
  day: string;
};

export function NoteCard({ title, day }: NoteCardProps) {
  return (
    <article className="rounded-xl p-4">
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="text-xs text-muted-foreground">{day}</p>
    </article>
  );
}`,
  },
  {
    path: 'src/lib/format-day.ts',
    code: `const FORMAT = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

export function formatDay(isoDate: string) {
  const date = new Date(isoDate);
  return FORMAT.format(date);
}`,
  },
  {
    path: 'package.json',
    code: `{
  "name": "harbour-notes",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}`,
  },
  {
    path: 'README.md',
    code: `# Harbour Notes

A small notebook for walks and lists.

Run \`pnpm dev\` and open the local address it prints.`,
  },
];

export function CodeTreeViewerProject() {
  return (
    <CodeTreeViewer
      aria-label='Harbour Notes files'
      files={FILES}
      defaultPath='src/app/page.tsx'
      className='w-full max-w-3xl'
    />
  );
}
