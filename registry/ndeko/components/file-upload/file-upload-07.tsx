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
  type FileWithPreview,
  formatBytes,
  useFileUpload,
} from '@/registry/ndeko/hooks/use-file-upload';
import {
  CircleAlertIcon,
  ImageIcon,
  UploadIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const MAX_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 6;
const ACCEPTED_TYPES = 'image/svg+xml,image/png,image/jpeg,image/jpg,image/gif';

const INITIAL_FILES: FileMetadata[] = [
  {
    name: 'cover-draft.png',
    size: 1528737,
    type: 'image/png',
    url: '',
    id: 'cover-draft',
  },
  {
    name: 'team-offsite.jpg',
    size: 2345678,
    type: 'image/jpeg',
    url: '',
    id: 'team-offsite',
  },
  {
    name: 'product-shot.jpg',
    size: 3456789,
    type: 'image/jpeg',
    url: '',
    id: 'product-shot',
  },
];

const DROP_ZONE = [
  'relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl p-4',
  'group hairline-border border-dashed border-foreground/20',
  'transition-[background-color,border-color,scale] duration-200 ease-(--ease-out-strong)',
  'data-dragging:scale-[1.01] motion-reduce:data-dragging:scale-100',
  'data-dragging:border-primary/50 data-dragging:bg-primary/[0.04]',
  'has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/25',
].join(' ');

const ICON_TILE =
  'keycap-3d text-muted-foreground mb-3 flex size-10 items-center justify-center rounded-full transition-transform duration-200 ease-(--ease-out-strong) group-data-dragging:-translate-y-0.5 motion-reduce:group-data-dragging:translate-y-0';

const FILE_ROW =
  'bg-card hairline-ring ring-border flex items-center justify-between gap-2 rounded-xl p-2 pe-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

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

function localPreviewOf(file: FileWithPreview) {
  const isLocalFile = file.file instanceof File;
  if (!isLocalFile) {
    return null;
  }
  return file.preview ?? null;
}

function Thumbnail({ file }: { file: FileWithPreview }) {
  const previewUrl = localPreviewOf(file);
  if (previewUrl) {
    return (
      <div
        role='img'
        aria-label={file.file.name}
        className='size-10 shrink-0 rounded-lg bg-cover bg-center'
        style={{ backgroundImage: `url(${previewUrl})` }}
      />
    );
  }
  return (
    <div
      role='img'
      aria-label={file.file.name}
      className='bg-primary/15 flex size-10 shrink-0 items-center justify-center rounded-lg'
    >
      <ImageIcon className='text-primary-ink/70 size-4' />
    </div>
  );
}

export default function FileUpload07() {
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
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: true,
    maxFiles: MAX_FILES,
    initialFiles: INITIAL_FILES,
  });

  const hasSeveralFiles = files.length > 1;
  const firstError = errors[0];

  return (
    <div className='flex w-full flex-col gap-2'>
      <div
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
          aria-label='Upload image files'
        />
        <div className='flex flex-col items-center justify-center px-4 py-3 text-center'>
          <div className={ICON_TILE} aria-hidden='true'>
            <ImageIcon className='size-4' />
          </div>
          <p className='mb-1 text-[13px] font-medium'>Drop your images here</p>
          <p className='text-muted-foreground text-xs'>
            SVG, PNG, JPG or GIF (max. {formatBytes(MAX_SIZE)})
          </p>
          <Button variant='outline' className='mt-4' onClick={openFileDialog}>
            <UploadIcon className='-ms-1 opacity-60' />
            Select images
          </Button>
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
                  <Thumbnail file={file} />
                  <div className='flex min-w-0 flex-col gap-0.5'>
                    <p className='truncate text-[13px] font-medium'>
                      {file.file.name}
                    </p>
                    <p className='text-muted-foreground text-xs tabular-nums'>
                      {formatBytes(file.file.size)}
                    </p>
                  </div>
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
      {hasSeveralFiles && (
        <div>
          <Button size='sm' variant='outline' onClick={clearFiles}>
            Remove all files
          </Button>
        </div>
      )}
    </div>
  );
}
