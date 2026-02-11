'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';

import {
  type FileMetadata,
  formatBytes,
  useFileUpload,
} from '@/registry/ndeko/hooks/use-file-upload';
import {
  CircleAlertIcon,
  PaperclipIcon,
  UploadIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const MAX_SIZE = 10 * 1024 * 1024;

const INITIAL_FILES: FileMetadata[] = [
  {
    name: 'brand-guidelines.pdf',
    size: 1528737,
    type: 'application/pdf',
    url: '',
    id: 'brand-guidelines',
  },
];

const DROP_ZONE = [
  'flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl p-4',
  'group hairline-border border-dashed border-foreground/20',
  'transition-[background-color,border-color,scale] duration-200 ease-(--ease-out-strong)',
  'data-dragging:scale-[1.01] motion-reduce:data-dragging:scale-100',
  'hover:bg-foreground/[0.025] data-dragging:border-primary/50 data-dragging:bg-primary/[0.04]',
  'has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/25',
  'has-disabled:pointer-events-none has-disabled:opacity-50',
].join(' ');

const ICON_TILE =
  'keycap-3d text-muted-foreground mb-3 flex size-10 items-center justify-center rounded-full transition-transform duration-200 ease-(--ease-out-strong) group-data-dragging:-translate-y-0.5 motion-reduce:group-data-dragging:translate-y-0';

const FILE_ROW =
  'bg-card hairline-ring ring-border flex items-center justify-between gap-2 rounded-xl px-4 py-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

const ENTER_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1],
};
const EXIT_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.23, 1, 0.32, 1],
};

const ITEM_VARIANTS: Variants = {
  hidden: { height: 0, opacity: 0, transition: EXIT_TRANSITION },
  shown: { height: 'auto', opacity: 1, transition: ENTER_TRANSITION },
};

const FADE_VARIANTS: Variants = {
  hidden: { opacity: 0, transition: EXIT_TRANSITION },
  shown: { opacity: 1, transition: ENTER_TRANSITION },
};

function itemVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return ITEM_VARIANTS;
}

function presenceOf(isPresent: boolean) {
  if (isPresent) {
    return true;
  }
  return undefined;
}

export default function FileUpload08() {
  const shouldReduceMotion = useReducedMotion();
  const itemVariants = itemVariantsOf(shouldReduceMotion);

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    maxSize: MAX_SIZE,
    initialFiles: INITIAL_FILES,
  });

  const hasFile = files.length > 0;
  const firstError = errors[0];

  return (
    <div className='flex w-full flex-col gap-2'>
      <div
        role='button'
        onClick={openFileDialog}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-dragging={presenceOf(isDragging)}
        className={DROP_ZONE}
      >
        <input
          {...getInputProps()}
          className='sr-only'
          aria-label='Upload file'
          disabled={hasFile}
        />
        <div className='flex flex-col items-center justify-center text-center'>
          <div className={ICON_TILE} aria-hidden='true'>
            <UploadIcon className='size-4' />
          </div>
          <p className='mb-1 text-[13px] font-medium'>Upload file</p>
          <p className='text-muted-foreground text-xs'>
            Drag and drop or click to browse (max. {formatBytes(MAX_SIZE)})
          </p>
        </div>
      </div>
      {firstError && (
        <p
          role='alert'
          className='text-destructive-ink flex items-center gap-1.5 text-xs'
        >
          <CircleAlertIcon className='size-3.5 shrink-0' />
          <span>{firstError}</span>
        </p>
      )}
      <div className='-my-1 flex flex-col'>
        <AnimatePresence initial={false}>
          {files.map((file) => (
            <motion.div
              key={file.id}
              className='-mx-1 overflow-hidden px-1 py-1'
              variants={itemVariants}
              initial='hidden'
              animate='shown'
              exit='hidden'
            >
              <div className={FILE_ROW}>
                <div className='flex items-center gap-3 overflow-hidden'>
                  <PaperclipIcon className='text-muted-foreground size-4 shrink-0' />
                  <p className='truncate text-[13px] font-medium'>
                    {file.file.name}
                  </p>
                </div>
                <Button
                  size='icon'
                  variant='ghost'
                  className='text-muted-foreground hover:text-foreground -me-2'
                  onClick={() => removeFile(file.id)}
                  aria-label={`Remove ${file.file.name}`}
                >
                  <XIcon />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
