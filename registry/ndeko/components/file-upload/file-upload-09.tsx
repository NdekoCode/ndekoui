'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';

import {
  type FileMetadata,
  formatBytes,
  useFileUpload,
} from '@/registry/ndeko/hooks/use-file-upload';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  CircleAlertIcon,
  FileArchiveIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileUpIcon,
  HeadphonesIcon,
  ImageIcon,
  VideoIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const MAX_SIZE = 100 * 1024 * 1024;
const MAX_FILES = 10;

const INITIAL_FILES: FileMetadata[] = [
  {
    name: 'brand-guidelines.pdf',
    size: 528737,
    type: 'application/pdf',
    url: '',
    id: 'brand-guidelines',
  },
  {
    name: 'q3-roadmap.zip',
    size: 252873,
    type: 'application/zip',
    url: '',
    id: 'q3-roadmap',
  },
  {
    name: 'budget-2027.xlsx',
    size: 352873,
    type: 'application/xlsx',
    url: '',
    id: 'budget-2027',
  },
];

const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const ARCHIVE_EXTENSIONS = ['.zip', '.rar'];
const SPREADSHEET_EXTENSIONS = ['.xls', '.xlsx'];
const FILE_ICON_CLASS = 'size-4';

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

const ROW_ICON_TILE =
  'keycap-3d text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg';

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
  if (type.startsWith('image/')) {
    return <ImageIcon className={FILE_ICON_CLASS} />;
  }
  return <FileIcon className={FILE_ICON_CLASS} />;
}

export default function FileUpload09() {
  const shouldReduceMotion = usePrefersReducedMotion();
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
    multiple: true,
    maxFiles: MAX_FILES,
    maxSize: MAX_SIZE,
    initialFiles: INITIAL_FILES,
  });

  const hasSeveralFiles = files.length > 1;
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
          aria-label='Upload files'
        />
        <div className='flex flex-col items-center justify-center text-center'>
          <div className={ICON_TILE} aria-hidden='true'>
            <FileUpIcon className='size-4' />
          </div>
          <p className='mb-1 text-[13px] font-medium'>Upload files</p>
          <p className='text-muted-foreground mb-2 text-xs'>
            Drag and drop or click to browse
          </p>
          <p className='text-muted-foreground/75 text-xs tabular-nums'>
            All files · Max {MAX_FILES} files · Up to {formatBytes(MAX_SIZE)}
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
                  <div className={ROW_ICON_TILE} aria-hidden='true'>
                    {fileIconOf(file.file)}
                  </div>
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
