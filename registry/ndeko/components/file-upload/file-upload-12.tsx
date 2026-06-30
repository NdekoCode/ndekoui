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
  FileArchiveIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  HeadphonesIcon,
  ImageIcon,
  Trash2Icon,
  UploadIcon,
  VideoIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const MAX_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 6;

const INITIAL_FILES: FileMetadata[] = [
  {
    name: 'q3-roadmap.zip',
    size: 252873,
    type: 'application/zip',
    url: '',
    id: 'q3-roadmap',
  },
  {
    name: 'cover-draft.png',
    size: 1528737,
    type: 'image/png',
    url: '',
    id: 'cover-draft',
  },
  {
    name: 'standup-notes.mp3',
    size: 1528737,
    type: 'audio/mpeg',
    url: '',
    id: 'standup-notes',
  },
];

const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const ARCHIVE_EXTENSIONS = ['.zip', '.rar'];
const SPREADSHEET_EXTENSIONS = ['.xls', '.xlsx'];
const FILE_ICON_CLASS = 'text-muted-foreground size-5';

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

const FILE_CARD =
  'bg-card hairline-ring ring-border relative flex flex-col rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

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

function hasExtension(name: string, extensions: string[]) {
  return extensions.some((extension) => name.endsWith(extension));
}

function isDocument(type: string, name: string) {
  const isDocumentType = type.includes('pdf') || type.includes('word');
  const hasDocumentExtension = hasExtension(name, DOCUMENT_EXTENSIONS);
  return isDocumentType || hasDocumentExtension;
}

function isArchive(type: string, name: string) {
  const isArchiveType = type.includes('zip') || type.includes('archive');
  const hasArchiveExtension = hasExtension(name, ARCHIVE_EXTENSIONS);
  return isArchiveType || hasArchiveExtension;
}

function isSpreadsheet(type: string, name: string) {
  const isSpreadsheetType = type.includes('excel') || type.includes('xlsx');
  const hasSpreadsheetExtension = hasExtension(name, SPREADSHEET_EXTENSIONS);
  return isSpreadsheetType || hasSpreadsheetExtension;
}

function fileIconOf(file: File | FileMetadata) {
  const type = file.type;
  const name = file.name.toLowerCase();
  if (isDocument(type, name)) {
    return <FileTextIcon className={FILE_ICON_CLASS} />;
  }
  if (isArchive(type, name)) {
    return <FileArchiveIcon className={FILE_ICON_CLASS} />;
  }
  if (isSpreadsheet(type, name)) {
    return <FileSpreadsheetIcon className={FILE_ICON_CLASS} />;
  }
  if (type.startsWith('video/')) {
    return <VideoIcon className={FILE_ICON_CLASS} />;
  }
  if (type.startsWith('audio/')) {
    return <HeadphonesIcon className={FILE_ICON_CLASS} />;
  }
  return <FileIcon className={FILE_ICON_CLASS} />;
}

function localPreviewOf(file: FileWithPreview) {
  const isLocalFile = file.file instanceof File;
  if (!isLocalFile) {
    return null;
  }
  return file.preview ?? null;
}

function FilePreview({ file }: { file: FileWithPreview }) {
  const isImage = file.file.type.startsWith('image/');
  const previewUrl = localPreviewOf(file);
  if (!isImage) {
    return (
      <div
        className='bg-foreground/[0.04] flex aspect-square items-center justify-center rounded-t-[inherit]'
        aria-hidden='true'
      >
        {fileIconOf(file.file)}
      </div>
    );
  }
  if (previewUrl) {
    return (
      <div
        role='img'
        aria-label={file.file.name}
        className='aspect-square rounded-t-[inherit] bg-cover bg-center'
        style={{ backgroundImage: `url(${previewUrl})` }}
      />
    );
  }
  return (
    <div
      role='img'
      aria-label={file.file.name}
      className='bg-primary/15 flex aspect-square items-center justify-center rounded-t-[inherit]'
    >
      <ImageIcon className='text-primary-ink/70 size-5' />
    </div>
  );
}

export default function FileUpload12() {
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
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    multiple: true,
    maxFiles: MAX_FILES,
    maxSize: MAX_SIZE,
    initialFiles: INITIAL_FILES,
  });

  const hasFiles = files.length > 0;
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
          aria-label='Upload files'
        />
        {hasFiles && (
          <div className='flex w-full flex-col gap-3'>
            <div className='flex items-center justify-between gap-2'>
              <h3 className='flex items-center gap-2 text-[13px] font-medium'>
                Files
                <span className={COUNT}>{files.length}</span>
              </h3>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm' onClick={openFileDialog}>
                  <UploadIcon className='-ms-0.5 size-3.5 opacity-60' />
                  Add files
                </Button>
                <Button variant='outline' size='sm' onClick={clearFiles}>
                  <Trash2Icon className='-ms-0.5 size-3.5 opacity-60' />
                  Remove all
                </Button>
              </div>
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
                    className={FILE_CARD}
                  >
                    <FilePreview file={file} />
                    <Button
                      size='icon'
                      onClick={() => removeFile(file.id)}
                      aria-label={`Remove ${file.file.name}`}
                      className='border-background absolute -end-2 -top-2 size-6 border-2 ring-0'
                    >
                      <XIcon className='size-3.5' />
                    </Button>
                    <div className='flex min-w-0 flex-col gap-0.5 p-3'>
                      <p className='truncate text-[13px] font-medium'>
                        {file.file.name}
                      </p>
                      <p className='text-muted-foreground truncate text-xs tabular-nums'>
                        {formatBytes(file.file.size)}
                      </p>
                    </div>
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
            <p className='mb-1 text-[13px] font-medium'>Drop your files here</p>
            <p className='text-muted-foreground text-xs tabular-nums'>
              Max {MAX_FILES} files · Up to {formatBytes(MAX_SIZE)}
            </p>
            <Button variant='outline' className='mt-4' onClick={openFileDialog}>
              <UploadIcon className='-ms-1 opacity-60' />
              Select files
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
