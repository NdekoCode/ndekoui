'use client';

import { useFileUpload } from '@/registry/ndeko/hooks/use-file-upload';
import { CircleUserRoundIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const DROP_AREA = [
  'relative flex size-16 cursor-pointer items-center justify-center overflow-hidden rounded-full outline-none',
  'group hairline-border border-dashed border-foreground/20',
  'transition-[background-color,border-color,scale] duration-200 ease-(--ease-out-strong)',
  'data-dragging:scale-[1.04] motion-reduce:data-dragging:scale-100',
  'active:scale-[0.97] motion-reduce:active:scale-100',
  'hover:bg-foreground/[0.025] data-dragging:border-primary/50 data-dragging:bg-primary/[0.04]',
  'focus-visible:ring-[3px] focus-visible:ring-ring/25',
  'has-disabled:pointer-events-none has-disabled:opacity-50',
  'data-filled:border-solid data-filled:border-border',
].join(' ');

const AVATAR_ICON =
  'text-muted-foreground size-4 transition-transform duration-200 ease-(--ease-out-strong) group-data-dragging:-translate-y-0.5 motion-reduce:group-data-dragging:translate-y-0';

function presenceOf(isPresent: boolean) {
  if (isPresent) {
    return true;
  }
  return undefined;
}

function avatarActionOf(hasImage: boolean) {
  if (hasImage) {
    return 'Change image';
  }
  return 'Upload image';
}

function backgroundOf(url: string): React.CSSProperties {
  return { backgroundImage: `url(${url})` };
}

export default function FileUpload03() {
  const [
    { files, isDragging },
    {
      removeFile,
      openFileDialog,
      getInputProps,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
    },
  ] = useFileUpload({
    accept: 'image/*',
  });

  const image = files[0];
  const previewUrl = image?.preview;
  const fileName = image?.file.name;
  const hasImage = Boolean(previewUrl);

  function removeImage() {
    if (!image) {
      return;
    }
    removeFile(image.id);
  }

  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='relative inline-flex'>
        <button
          type='button'
          className={DROP_AREA}
          onClick={openFileDialog}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={presenceOf(isDragging)}
          data-filled={presenceOf(hasImage)}
          aria-label={avatarActionOf(hasImage)}
        >
          {previewUrl && (
            <div
              role='img'
              aria-label={fileName}
              className='size-full bg-cover bg-center'
              style={backgroundOf(previewUrl)}
            />
          )}
          {!previewUrl && <CircleUserRoundIcon className={AVATAR_ICON} />}
        </button>
        {hasImage && (
          <Button
            size='icon'
            onClick={removeImage}
            aria-label='Remove image'
            className='border-background absolute -end-1 -top-1 size-6 border-2 ring-0'
          >
            <XIcon className='size-3.5' />
          </Button>
        )}
        <input
          {...getInputProps()}
          className='sr-only'
          aria-label='Upload image file'
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
