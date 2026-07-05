'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ArchiveIcon,
  DownloadIcon,
  LoaderIcon,
  RotateCcwIcon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';

import {
  ARCHIVABLE_TASK,
  ESTIMATE_VALUE,
  EXPORT_DURATION_MS,
  INVITE_EMAIL,
  REPORT_NAME,
  REPORT_RECIPIENT,
  TEAM_NAME,
} from './data';
import {
  fadePresence,
  heightPresenceOf,
  MorphText,
  Swap,
} from './motion-parts';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type TileProps = {
  title: string;
  line: string;
  children: React.ReactNode;
};

function Tile({ title, line, children }: TileProps) {
  return (
    <section className='bg-card hairline-ring ring-border flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div>
        <h2 className='text-sm font-medium'>{title}</h2>
        <p className='text-muted-foreground mt-0.5 text-[13px] text-pretty'>
          {line}
        </p>
      </div>
      <div className='mt-auto'>{children}</div>
    </section>
  );
}

export function InviteTile() {
  const fieldId = useId();
  const errorId = useId();
  const [email, setEmail] = useState(INVITE_EMAIL);
  const [isInvalid, setIsInvalid] = useState(false);

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    const isEmail = EMAIL_PATTERN.test(trimmed);
    if (!isEmail) {
      setIsInvalid(true);
      return;
    }
    setIsInvalid(false);
    toast.success(`Invite sent to ${trimmed}`, {
      description: `They can join ${TEAM_NAME} from the email`,
    });
  }

  return (
    <Tile
      title='Success'
      line='The invite lands in an inbox the sender cannot see, so a toast confirms it'
    >
      <form onSubmit={send} noValidate className='flex flex-col gap-1.5'>
        <Label htmlFor={fieldId}>Email address</Label>
        <div className='flex gap-2'>
          <Input
            id={fieldId}
            type='email'
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={isInvalid}
            aria-describedby={errorId}
          />
          <Button type='submit'>Send invite</Button>
        </div>
        <p
          id={errorId}
          aria-live='polite'
          className='text-destructive-ink text-xs'
        >
          {isInvalid && 'Enter an email address such as name@example.com'}
        </p>
      </form>
    </Tile>
  );
}

export function EstimateTile() {
  function save() {
    toast.error('Couldn’t save the estimate', {
      description:
        'The connection dropped while saving, the value stays in the field until you retry',
      action: {
        label: 'Retry',
        onClick: () => toast.success(`Estimate saved as ${ESTIMATE_VALUE}`),
      },
    });
  }

  return (
    <Tile
      title='Error with its reason'
      line='A failure says what went wrong in words and offers the way back'
    >
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground w-16 shrink-0 text-[13px]'>
          Estimate
        </span>
        <span className='min-w-0 flex-1 text-[13px] font-medium tabular-nums'>
          {ESTIMATE_VALUE}
        </span>
        <Button variant='outline' onClick={save}>
          Save
        </Button>
      </div>
    </Tile>
  );
}

function waitForExport() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, EXPORT_DURATION_MS);
  });
}

function exportLabelOf(isExporting: boolean) {
  if (isExporting) {
    return 'Exporting';
  }
  return 'Export report';
}

export function ExportTile() {
  const [isExporting, setIsExporting] = useState(false);

  function startExport() {
    setIsExporting(true);
    const exporting = waitForExport();
    toast.promise(exporting, {
      loading: <MorphText text={`Preparing the ${REPORT_NAME}`} />,
      success: {
        message: <MorphText text={`${REPORT_NAME} is ready`} />,
        description: `Sent to ${REPORT_RECIPIENT} as a PDF`,
      },
      finally: () => setIsExporting(false),
    });
  }

  return (
    <Tile
      title='Loading, then the result'
      line='One toast follows the work and becomes its outcome when it ends'
    >
      <Button variant='outline' disabled={isExporting} onClick={startExport}>
        <Swap swapKey={String(isExporting)}>
          {isExporting && <LoaderIcon className='animate-spin' />}
          {!isExporting && <DownloadIcon />}
        </Swap>
        <AnimatedSize axis='width'>
          <MorphText text={exportLabelOf(isExporting)} />
        </AnimatedSize>
      </Button>
    </Tile>
  );
}

export function ArchiveTile() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [isArchived, setIsArchived] = useState(false);
  const presence = heightPresenceOf(shouldReduceMotion);

  function restore() {
    setIsArchived(false);
  }

  function archive() {
    setIsArchived(true);
    toast('Task archived', {
      description: `${ARCHIVABLE_TASK.key} ${ARCHIVABLE_TASK.title}`,
      action: { label: 'Undo', onClick: restore },
    });
  }

  return (
    <Tile
      title='Undo'
      line='A reversible action runs at once and keeps a way back for a few seconds'
    >
      <AnimatedSize>
        <AnimatePresence mode='popLayout' initial={false}>
          {!isArchived && (
            <motion.div key='task' {...presence} className='overflow-hidden'>
              <div className='hairline-ring ring-border flex h-10 items-center gap-2.5 rounded-lg ps-3 pe-1'>
                <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
                  {ARCHIVABLE_TASK.key}
                </span>
                <span className='min-w-0 flex-1 truncate text-[13px]'>
                  {ARCHIVABLE_TASK.title}
                </span>
                <Button variant='ghost' size='sm' onClick={archive}>
                  <ArchiveIcon />
                  Archive
                </Button>
              </div>
            </motion.div>
          )}
          {isArchived && (
            <motion.div key='archived' {...fadePresence()}>
              <div className='hairline-border border-foreground/20 text-muted-foreground flex h-10 items-center justify-between gap-2 rounded-lg border-dashed ps-3 pe-1 text-[13px]'>
                <span className='truncate'>
                  {ARCHIVABLE_TASK.key} is archived
                </span>
                <Button variant='ghost' size='sm' onClick={restore}>
                  <RotateCcwIcon />
                  Restore
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatedSize>
    </Tile>
  );
}
