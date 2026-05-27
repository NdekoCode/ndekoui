'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/registry/ndeko/ui/button';
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@/registry/ndeko/ui/progress';

const UPLOAD_COMPLETE = 100;
const UPLOAD_STEP = 12;
const UPLOAD_TICK_MS = 280;
const EXPORT_DURATION_MS = 1600;
const FILE_NAME = 'brand-guide.pdf';

function nextUploadValue(value: number) {
  const nextValue = value + UPLOAD_STEP;
  return Math.min(nextValue, UPLOAD_COMPLETE);
}

function uploadLabelOf(isUploading: boolean) {
  if (isUploading) {
    return `Uploading ${FILE_NAME}`;
  }
  return `${FILE_NAME} uploaded`;
}

function uploadActionOf(isUploading: boolean) {
  if (isUploading) {
    return 'Uploading';
  }
  return 'Upload again';
}

function waitFor(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

function showRestored() {
  toast.success('Project restored');
}

function showSaved() {
  toast.success('Changes saved', {
    description: 'Website redesign is up to date.',
  });
}

function showArchived() {
  toast('Project archived', {
    description: 'It stays in Archive for 30 days.',
    action: { label: 'Undo', onClick: showRestored },
  });
}

function showExport() {
  toast.promise(waitFor(EXPORT_DURATION_MS), {
    loading: 'Exporting the report',
    success: 'Report exported',
    error: 'The export failed, try again',
  });
}

export function ProgressDemo() {
  const [value, setValue] = useState(UPLOAD_COMPLETE);
  const [hasStarted, setHasStarted] = useState(false);
  const isComplete = value >= UPLOAD_COMPLETE;
  const isUploading = hasStarted && !isComplete;
  const label = uploadLabelOf(isUploading);
  const action = uploadActionOf(isUploading);

  useEffect(() => {
    if (!isUploading) {
      return;
    }
    const timer = setInterval(() => {
      setValue(nextUploadValue);
    }, UPLOAD_TICK_MS);
    return () => clearInterval(timer);
  }, [isUploading]);

  function startUpload() {
    setValue(0);
    setHasStarted(true);
  }

  return (
    <div className='flex w-full max-w-xs flex-col gap-6'>
      <Progress value={value}>
        <div className='flex items-center justify-between gap-3'>
          <ProgressLabel>{label}</ProgressLabel>
          <ProgressValue />
        </div>
      </Progress>
      <Progress value={null}>
        <ProgressLabel>Preparing the export</ProgressLabel>
      </Progress>
      <Button
        variant='outline'
        size='sm'
        className='self-start'
        disabled={isUploading}
        onClick={startUpload}
      >
        {action}
      </Button>
    </div>
  );
}

export function ToasterDemo() {
  return (
    <div className='flex flex-wrap items-center justify-center gap-2'>
      <Button variant='outline' onClick={showSaved}>
        Save changes
      </Button>
      <Button variant='outline' onClick={showArchived}>
        Archive project
      </Button>
      <Button variant='outline' onClick={showExport}>
        Export report
      </Button>
    </div>
  );
}
