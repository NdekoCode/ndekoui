'use client';

import { useState } from 'react';

import { installCommandOf } from '@/lib/site';
import { CodeIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/registry/ndeko/ui/dialog';
import { Skeleton } from '@/registry/ndeko/ui/skeleton';

import { CopyButton } from './copy-button';
import { OpenInMenu } from './open-in/open-in-menu';

type CodeFile = {
  label: string;
  source: string;
  html: string;
};

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

type CodeDialogProps = {
  title: string;
  description: string;
  itemName: string;
};

const CODE_SURFACE =
  'relative rounded-xl bg-[hsl(240_6%_8%)] p-4 text-[13px] leading-relaxed ring-1 ring-white/10';

const SKELETON_WIDTHS = ['w-2/3', 'w-1/2', 'w-5/6', 'w-1/3', 'w-3/4', 'w-2/5'];

function isCodeFile(value: unknown): value is CodeFile {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const hasLabel = typeof candidate.label === 'string';
  const hasSource = typeof candidate.source === 'string';
  const hasHtml = typeof candidate.html === 'string';
  return hasLabel && hasSource && hasHtml;
}

function filesOf(payload: unknown): CodeFile[] {
  if (typeof payload !== 'object' || payload === null) {
    return [];
  }
  const files = (payload as { files?: unknown }).files;
  if (!Array.isArray(files)) {
    return [];
  }
  return files.filter(isCodeFile);
}

async function fetchCodeFiles(itemName: string) {
  const response = await fetch(`/code/${encodeURIComponent(itemName)}`);
  if (!response.ok) {
    throw new Error(`The code of ${itemName} answered ${response.status}`);
  }
  const payload: unknown = await response.json();
  return filesOf(payload);
}

function CodeLoading() {
  return (
    <div
      className='flex flex-col gap-2.5 py-1'
      aria-busy='true'
      aria-label='Loading the code'
    >
      {SKELETON_WIDTHS.map((width) => (
        <Skeleton key={width} className={`h-3 bg-white/10 ${width}`} />
      ))}
    </div>
  );
}

function CodeError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className='flex flex-col items-start gap-3 py-2 text-white/80'>
      <p>The code could not load. Check your connection, then try again.</p>
      <Button variant='outline' size='sm' onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function CodeFiles({ files }: { files: CodeFile[] }) {
  const hasSeveralFiles = files.length > 1;
  return (
    <div className='flex flex-col gap-6'>
      {files.map((file) => (
        <div key={file.label} className='relative flex flex-col gap-2'>
          <div className='flex items-center justify-between gap-2 text-white/60'>
            {hasSeveralFiles && (
              <p className='font-mono text-[11px]'>{file.label}</p>
            )}
            <div className='ms-auto'>
              <CopyButton value={file.source} label={`Copy ${file.label}`} />
            </div>
          </div>
          <div
            className='font-mono [&_pre]:!bg-transparent'
            dangerouslySetInnerHTML={{ __html: file.html }}
          />
        </div>
      ))}
    </div>
  );
}

/** Shows an item's install command and loads its highlighted code only when opened. */
export function CodeDialog({ title, description, itemName }: CodeDialogProps) {
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [files, setFiles] = useState<CodeFile[]>([]);
  const installCommand = installCommandOf(itemName);

  async function load() {
    setStatus('loading');
    try {
      const loaded = await fetchCodeFiles(itemName);
      setFiles(loaded);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }

  function loadOnFirstOpen(isOpen: boolean) {
    const needsLoad = status === 'idle';
    if (isOpen && needsLoad) {
      load();
    }
  }

  return (
    <div className='flex shrink-0 items-center gap-0.5'>
      <OpenInMenu title={title} itemName={itemName} />
      <Dialog onOpenChange={loadOnFirstOpen}>
        <DialogTrigger
          render={<Button variant='outline' size='sm' />}
          aria-label={`Code of ${title}`}
        >
          <CodeIcon />
          Code
        </DialogTrigger>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className='bg-foreground/[0.04] flex items-center gap-2 rounded-lg py-1 pr-1 pl-3'>
            <code className='text-muted-foreground min-w-0 flex-1 truncate font-mono text-xs'>
              {installCommand}
            </code>
            <CopyButton value={installCommand} label='Copy install command' />
          </div>
          <div className={CODE_SURFACE}>
            <div className='max-h-[55dvh] overflow-auto'>
              {status === 'loading' && <CodeLoading />}
              {status === 'error' && <CodeError onRetry={load} />}
              {status === 'ready' && <CodeFiles files={files} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
