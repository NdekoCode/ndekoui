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
    size: 1874211,
    type: 'image/jpeg',
    url: '',
    id: 'product-shot',
  },
  {
    name: 'office-plan.png',
    size: 982344,
    type: 'image/png',
    url: '',
    id: 'office-plan',
  },
];

const DROP_ZONE = [
  'relative flex min-h-52 flex-col items-center overflow-hidden rounded-xl p-4 not-data-files:justify-center',
  'group hairline-border border-dashed border-foreground/20',
  'transition-[background-color,border-color,scale] duration-200 ease-(--ease-out-strong)',
  'data-dragging:scale-[1.01] motion-reduce:data-dragging:scale-100',
  'data-dragging:border-primary/50 data-dragging:bg-primary/[0.04]',
  'has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/25',
].join(' ');

const ICON_TILE =
  'keycap-3d text-muted-foreground mb-3 flex size-10 items-center justify-center rounded-full transition-transform duration-200 ease-(--ease-out-strong) group-data-dragging:-translate-y-0.5 motion-reduce:group-data-dragging:translate-y-0';

const COUNT =
  'keycap-3d inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] px-1 text-[11px] font-medium tabular-nums text-muted-foreground';

const ENTER_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1],
};
const EXIT_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.23, 1, 0.32, 1],
};
const LAYOUT_TRANSITION: Transition = {
  layout: { type: 'spring', bounce: 0, duration: 0.3 },
};

const TILE_VARIANTS: Variants = {
  hidden: { opacity: 0, scale: 0.9, transition: EXIT_TRANSITION },
  shown: { opacity: 1, scale: 1, transition: ENTER_TRANSITION },
};

const FADE_VARIANTS: Variants = {
  hidden: { opacity: 0, transition: EXIT_TRANSITION },
  shown: { opacity: 1, transition: ENTER_TRANSITION },
};

function tileVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return TILE_VARIANTS;
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
        className='size-full rounded-[inherit] bg-cover bg-center'
        style={{ backgroundImage: `url(${previewUrl})` }}
      />
    );
  }
  return (
    <div
      role='img'
      aria-label={file.file.name}
      className='from-primary/20 to-info/25 flex size-full items-center justify-center rounded-[inherit] bg-linear-to-br'
    >
      <ImageIcon className='text-primary-ink/70 size-5' />
    </div>
  );
}

export default function FileUpload06() {
  const shouldReduceMotion = useReducedMotion();
  const tileVariants = tileVariantsOf(shouldReduceMotion);
  const shouldAnimateLayout = !shouldReduceMotion;

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
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: true,
    maxFiles: MAX_FILES,
    initialFiles: INITIAL_FILES,
  });

  const hasFiles = files.length > 0;
  const isFull = files.length >= MAX_FILES;
  const firstError = errors[0];

  return (
    <div className='flex w-full flex-col gap-2'>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-dragging={presenceOf(isDragging)}
        data-files={presenceOf(hasFiles)}
        className={DROP_ZONE}
      >
        <input
          {...getInputProps()}
          className='sr-only'
          aria-label='Upload image files'
        />
        {hasFiles && (
          <div className='flex w-full flex-col gap-3'>
            <div className='flex items-center justify-between gap-2'>
              <h3 className='flex items-center gap-2 text-[13px] font-medium'>
                Uploaded files
                <span className={COUNT}>{files.length}</span>
              </h3>
              <Button
                variant='outline'
                size='sm'
                onClick={openFileDialog}
                disabled={isFull}
              >
                <UploadIcon className='-ms-0.5 size-3.5 opacity-60' />
                Add more
              </Button>
            </div>
            <div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
              <AnimatePresence mode='popLayout' initial={false}>
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    layout={shouldAnimateLayout}
                    variants={tileVariants}
                    initial='hidden'
                    animate='shown'
                    exit='hidden'
                    transition={LAYOUT_TRANSITION}
                    className='bg-foreground/[0.04] relative aspect-square rounded-lg'
                  >
                    <Thumbnail file={file} />
                    <Button
                      size='icon'
                      onClick={() => removeFile(file.id)}
                      aria-label={`Remove ${file.file.name}`}
                      className='border-background absolute -end-2 -top-2 size-6 border-2 ring-0'
                    >
                      <XIcon className='size-3.5' />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
        {!hasFiles && (
          <div className='flex flex-col items-center justify-center px-4 py-3 text-center'>
            <div className={ICON_TILE} aria-hidden='true'>
              <ImageIcon className='size-4' />
            </div>
            <p className='mb-1 text-[13px] font-medium'>
              Drop your images here
            </p>
            <p className='text-muted-foreground text-xs'>
              SVG, PNG, JPG or GIF (max. {formatBytes(MAX_SIZE)})
            </p>
            <Button variant='outline' className='mt-4' onClick={openFileDialog}>
              <UploadIcon className='-ms-1 opacity-60' />
              Select images
            </Button>
          </div>
        )}
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
    </div>
  );
}
