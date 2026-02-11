'use client';

import {
  formatBytes,
  useFileUpload,
} from '@/registry/ndeko/hooks/use-file-upload';
import {
  CircleAlertIcon,
  ImageUpIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const MAX_SIZE = 5 * 1024 * 1024;

const DROP_ZONE = [
  'relative flex min-h-52 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl p-4',
  'group hairline-border border-dashed border-foreground/20',
  'transition-[background-color,border-color,scale] duration-200 ease-(--ease-out-strong)',
  'data-dragging:scale-[1.01] motion-reduce:data-dragging:scale-100',
  'hover:bg-foreground/[0.025] data-dragging:border-primary/50 data-dragging:bg-primary/[0.04]',
  'has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/25',
  'has-disabled:pointer-events-none has-disabled:opacity-50',
  'data-filled:border-solid data-filled:border-border',
].join(' ');

const ICON_TILE =
  'keycap-3d text-muted-foreground mb-3 flex size-10 items-center justify-center rounded-full transition-transform duration-200 ease-(--ease-out-strong) group-data-dragging:-translate-y-0.5 motion-reduce:group-data-dragging:translate-y-0';

function presenceOf(isPresent: boolean) {
  if (isPresent) {
    return true;
  }
  return undefined;
}

function backgroundOf(url: string): React.CSSProperties {
  return { backgroundImage: `url(${url})` };
}

export default function FileUpload04() {
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
    accept: 'image/*',
    maxSize: MAX_SIZE,
  });

  const image = files[0];
  const previewUrl = image?.preview;
  const fileName = image?.file.name;
  const hasImage = Boolean(previewUrl);
  const firstError = errors[0];

  function removeImage() {
    if (!image) {
      return;
    }
    removeFile(image.id);
  }

  return (
    <div className='flex w-full flex-col gap-2'>
      <div className='relative'>
        <div
          role='button'
          onClick={openFileDialog}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={presenceOf(isDragging)}
          data-filled={presenceOf(hasImage)}
          className={DROP_ZONE}
        >
          <input
            {...getInputProps()}
            className='sr-only'
            aria-label='Upload image file'
          />
          {previewUrl && (
            <div
              role='img'
              aria-label={fileName}
              className='absolute inset-0 bg-cover bg-center'
              style={backgroundOf(previewUrl)}
            />
          )}
          {!previewUrl && (
            <div className='flex flex-col items-center justify-center px-4 py-3 text-center'>
              <div className={ICON_TILE} aria-hidden='true'>
                <ImageUpIcon className='size-4' />
              </div>
              <p className='mb-1 text-[13px] font-medium'>
                Drop your image here or click to browse
              </p>
              <p className='text-muted-foreground text-xs'>
                Max size: {formatBytes(MAX_SIZE)}
              </p>
            </div>
          )}
        </div>
        {hasImage && (
          <Button
            variant='outline'
            size='icon-sm'
            onClick={removeImage}
            aria-label='Remove image'
            className='absolute end-3 top-3'
          >
            <XIcon />
          </Button>
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
