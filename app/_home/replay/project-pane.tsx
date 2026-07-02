import { memo } from 'react';

import Notification28 from '@/registry/ndeko/components/notification/notification-28';
import {
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

import {
  INSTALLED_FILE_PATH,
  PAGE_FILE_PATH,
  PREVIEW_ADDRESS,
  PROJECT_NAME,
  type ProjectView,
  TREE,
  type TreeEntry,
  viewAt,
} from './replay-script';

export type ReplayCode = {
  installedFile: string;
  pageBefore: string;
  pageAfter: string;
};

const PANE_IN = 'animate-line-in motion-reduce:animate-none';

const CODE_SURFACE =
  'h-full overflow-hidden px-4 py-3 font-mono text-[12.5px] leading-5 [&_.line]:inline-block [&_.line]:w-full [&_pre]:!bg-transparent [mask-image:linear-gradient(to_bottom,black_75%,transparent)]';

/* The lines the edit adds, tinted from the edge of the pane to the other. */
const ADDED_LINES =
  '[&_.line.is-added]:bg-success/12 [&_.line.is-added]:-mx-4 [&_.line.is-added]:px-4 [&_.line.is-added]:shadow-[inset_2px_0_0_var(--success)]';

function isEntryShown(entry: TreeEntry, elapsed: number) {
  if (entry.addedAt === undefined) {
    return true;
  }
  return elapsed >= entry.addedAt;
}

function markOf(entry: TreeEntry, elapsed: number) {
  if (entry.isFolder) {
    return null;
  }
  const isAdded = entry.addedAt !== undefined;
  if (isAdded) {
    return 'A';
  }
  const isModified = entry.modifiedAt !== undefined;
  const hasChanged = isModified && elapsed >= (entry.modifiedAt ?? 0);
  if (hasChanged) {
    return 'M';
  }
  return null;
}

function selectedPathOf(view: ProjectView) {
  if (view === 'installed-file') {
    return INSTALLED_FILE_PATH;
  }
  const isPageCode = view === 'page-before' || view === 'page-after';
  if (isPageCode) {
    return PAGE_FILE_PATH;
  }
  return null;
}

function tabLabelOf(view: ProjectView) {
  const selectedPath = selectedPathOf(view);
  if (selectedPath) {
    return selectedPath;
  }
  return PREVIEW_ADDRESS;
}

function indentOf(depth: number) {
  return { paddingInlineStart: `${0.75 + depth * 0.75}rem` };
}

function EntryIcon({ entry }: { entry: TreeEntry }) {
  if (!entry.isFolder) {
    return <FileIcon className='size-3.5 shrink-0 opacity-60' />;
  }
  if (entry.depth === 0) {
    return <FolderOpenIcon className='size-3.5 shrink-0 opacity-60' />;
  }
  return <FolderIcon className='size-3.5 shrink-0 opacity-60' />;
}

function TreeRow({
  entry,
  elapsed,
  isSelected,
}: {
  entry: TreeEntry;
  elapsed: number;
  isSelected: boolean;
}) {
  const mark = markOf(entry, elapsed);
  const isNew = entry.addedAt !== undefined;

  return (
    <li
      style={indentOf(entry.depth)}
      className={cn(
        'flex h-6 items-center gap-1.5 pe-3 text-[12.5px]',
        isNew && PANE_IN,
        isNew && 'text-success-foreground',
        isSelected && 'bg-foreground/[0.07] text-foreground'
      )}
    >
      <EntryIcon entry={entry} />
      <span className='min-w-0 flex-1 truncate'>{entry.name}</span>
      {mark && (
        <span
          className={cn(
            'font-mono text-[11px]',
            mark === 'A' && 'text-success-foreground',
            mark === 'M' && 'text-warning-foreground'
          )}
        >
          {mark}
        </span>
      )}
    </li>
  );
}

function FileTree({
  elapsed,
  selectedPath,
}: {
  elapsed: number;
  selectedPath: string | null;
}) {
  const shownEntries = TREE.filter((entry) => isEntryShown(entry, elapsed));

  return (
    <div className='text-muted-foreground hidden w-52 shrink-0 flex-col gap-1 py-2 lg:flex'>
      <p className='px-3 pb-1 text-[11px] font-medium tracking-wide'>
        {PROJECT_NAME}
      </p>
      <ul>
        {shownEntries.map((entry) => (
          <TreeRow
            key={entry.path}
            entry={entry}
            elapsed={elapsed}
            isSelected={entry.path === selectedPath}
          />
        ))}
      </ul>
    </div>
  );
}

/** The real component, kept out of the replay's frame updates so it keeps its own state. */
const LiveStack = memo(function LiveStack() {
  return <Notification28 />;
});

function DashboardPreview({ hasStack }: { hasStack: boolean }) {
  return (
    <div className='flex h-full flex-col items-center overflow-hidden px-6 pt-8'>
      <div className='flex w-full max-w-sm flex-col gap-4'>
        <p className='font-sans text-xl font-semibold'>Dashboard</p>
        {hasStack && (
          <div className='animate-settle-plain motion-reduce:animate-none'>
            <LiveStack />
          </div>
        )}
        {!hasStack && (
          <div className='hairline-border border-border h-24 rounded-xl border-dashed' />
        )}
      </div>
    </div>
  );
}

function HighlightedCode({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden='true'
      className={cn(CODE_SURFACE, PANE_IN, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function ViewBody({ view, code }: { view: ProjectView; code: ReplayCode }) {
  if (view === 'installed-file') {
    return <HighlightedCode html={code.installedFile} />;
  }
  if (view === 'page-before') {
    return <HighlightedCode html={code.pageBefore} />;
  }
  if (view === 'page-after') {
    return <HighlightedCode html={code.pageAfter} className={ADDED_LINES} />;
  }
  const hasStack = view === 'preview-after';
  return <DashboardPreview hasStack={hasStack} />;
}

/** The project beside the conversation: its files as the CLI writes them, then the page itself. */
export function ProjectPane({
  elapsed,
  code,
}: {
  elapsed: number;
  code: ReplayCode;
}) {
  const view = viewAt(elapsed);
  const selectedPath = selectedPathOf(view);

  return (
    <div className='bg-foreground/[0.03] flex h-full min-h-0'>
      <FileTree elapsed={elapsed} selectedPath={selectedPath} />
      <div className='bg-background/60 flex min-w-0 flex-1 flex-col'>
        <p className='text-muted-foreground flex h-9 shrink-0 items-center truncate px-4 font-mono text-[11.5px]'>
          {tabLabelOf(view)}
        </p>
        <div key={view} className='min-h-0 flex-1'>
          <ViewBody view={view} code={code} />
        </div>
      </div>
    </div>
  );
}
