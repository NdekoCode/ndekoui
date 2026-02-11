'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';

import {
  type FileMetadata,
  type FileWithPreview,
  formatBytes,
  useFileUpload,
} from '@/registry/ndeko/hooks/use-file-upload';
import {
  CircleAlertIcon,
  DownloadIcon,
  FileArchiveIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  HeadphonesIcon,
  ImageIcon,
  Trash2Icon,
  UploadCloudIcon,
  UploadIcon,
  VideoIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/ndeko/ui/table';

const MAX_SIZE = 10 * 1024 * 1024;
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
const FILE_ICON_CLASS = 'text-muted-foreground size-4';

const DROP_ZONE = [
  'flex min-h-56 flex-col items-center justify-center rounded-xl p-4 data-files:hidden',
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

const ROW_ACTION = 'text-muted-foreground hover:text-foreground';

const ENTER_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1],
};
const EXIT_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.23, 1, 0.32, 1],
};

const ROW_VARIANTS: Variants = {
  hidden: { opacity: 0, transition: EXIT_TRANSITION },
  shown: { opacity: 1, transition: ENTER_TRANSITION },
};

const MotionTableRow = motion.create(TableRow);

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

function typeLabelOf(name: string) {
  const parts = name.split('.');
  const hasExtensionPart = parts.length > 1;
  if (!hasExtensionPart) {
    return 'Unknown';
  }
  const extension = parts[parts.length - 1];
  return extension.toUpperCase();
}

function localUrlOf(file: FileWithPreview) {
  const isLocalFile = file.file instanceof File;
  if (!isLocalFile) {
    return null;
  }
  return file.preview ?? null;
}

function DownloadAction({ file }: { file: FileWithPreview }) {
  const url = localUrlOf(file);
  if (!url) {
    return null;
  }
  return (
    <Button
      size='icon'
      variant='ghost'
      className={ROW_ACTION}
      aria-label={`Download ${file.file.name}`}
      nativeButton={false}
      render={<a href={url} download={file.file.name} />}
    >
      <DownloadIcon />
    </Button>
  );
}

export default function FileUpload11() {
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
        <div className='flex flex-col items-center justify-center text-center'>
          <div className={ICON_TILE} aria-hidden='true'>
            <FileIcon className='size-4' />
          </div>
          <p className='mb-1 text-[13px] font-medium'>Upload files</p>
          <p className='text-muted-foreground text-xs tabular-nums'>
            Max {MAX_FILES} files · Up to {formatBytes(MAX_SIZE)}
          </p>
          <Button variant='outline' className='mt-4' onClick={openFileDialog}>
            <UploadIcon className='-ms-1 opacity-60' />
            Select files
          </Button>
        </div>
      </div>
      {hasFiles && (
        <>
          <div className='flex items-center justify-between gap-2'>
            <h3 className='flex items-center gap-2 text-[13px] font-medium'>
              Files
              <span className={COUNT}>{files.length}</span>
            </h3>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' onClick={openFileDialog}>
                <UploadCloudIcon className='-ms-0.5 size-3.5 opacity-60' />
                Add files
              </Button>
              <Button variant='outline' size='sm' onClick={clearFiles}>
                <Trash2Icon className='-ms-0.5 size-3.5 opacity-60' />
                Remove all
              </Button>
            </div>
          </div>
          <div className='bg-card hairline-ring ring-border overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='h-9'>Name</TableHead>
                  <TableHead className='h-9'>Type</TableHead>
                  <TableHead className='h-9 text-right'>Size</TableHead>
                  <TableHead className='h-9 w-0 text-right'>
                    <span className='sr-only'>Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {files.map((file) => (
                    <MotionTableRow
                      key={file.id}
                      variants={ROW_VARIANTS}
                      initial='hidden'
                      animate='shown'
                      exit='hidden'
                    >
                      <TableCell className='max-w-48 py-2 font-medium'>
                        <span className='flex items-center gap-2'>
                          <span className='shrink-0' aria-hidden='true'>
                            {fileIconOf(file.file)}
                          </span>
                          <span className='truncate'>{file.file.name}</span>
                        </span>
                      </TableCell>
                      <TableCell className='text-muted-foreground py-2'>
                        {typeLabelOf(file.file.name)}
                      </TableCell>
                      <TableCell className='text-muted-foreground py-2 text-right tabular-nums'>
                        {formatBytes(file.file.size)}
                      </TableCell>
                      <TableCell className='py-2 text-right whitespace-nowrap'>
                        <DownloadAction file={file} />
                        <Button
                          size='icon'
                          variant='ghost'
                          className={ROW_ACTION}
                          aria-label={`Remove ${file.file.name}`}
                          onClick={() => removeFile(file.id)}
                        >
                          <Trash2Icon />
                        </Button>
                      </TableCell>
                    </MotionTableRow>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </>
      )}
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
