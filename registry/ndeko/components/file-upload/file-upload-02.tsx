'use client';

import { useFileUpload } from '@/registry/ndeko/hooks/use-file-upload';
import { CircleUserRoundIcon, XIcon } from '@/registry/ndeko/lib/icons';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';

function avatarActionOf(hasImage: boolean) {
  if (hasImage) {
    return 'Change image';
  }
  return 'Upload image';
}

export default function FileUpload02() {
  const [{ files }, { removeFile, openFileDialog, getInputProps }] =
    useFileUpload({
      accept: 'image/*',
    });

  const image = files[0];
  const previewUrl = image?.preview;
  const fileName = image?.file.name;
  const hasImage = Boolean(image);

  function removeImage() {
    if (!image) {
      return;
    }
    removeFile(image.id);
  }

  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='relative inline-flex'>
        <Button
          variant='outline'
          className='size-16 overflow-hidden p-0'
          onClick={openFileDialog}
          aria-label={avatarActionOf(hasImage)}
        >
          <Avatar className='size-full bg-transparent ring-0'>
            {previewUrl && (
              <AvatarImage src={previewUrl} alt='Preview of uploaded image' />
            )}
            <AvatarFallback className='bg-transparent'>
              <CircleUserRoundIcon className='opacity-60' />
            </AvatarFallback>
          </Avatar>
        </Button>
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
      {fileName && <p className='text-muted-foreground text-xs'>{fileName}</p>}
    </div>
  );
}
