'use client';

import { useId } from 'react';

import { useCharacterLimit } from '@/registry/ndeko/hooks/use-character-limit';
import { useFileUpload } from '@/registry/ndeko/hooks/use-file-upload';
import { CheckIcon, ImagePlusIcon, XIcon } from '@/registry/ndeko/lib/icons';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/registry/ndeko/ui/dialog';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { Textarea } from '@/registry/ndeko/ui/textarea';

const BIO_MAX_LENGTH = 180;
const INITIAL_BIO =
  'Product designer at Fernhill Studio. I draw interfaces, then the systems behind them.';

function remainingLabelOf(remaining: number) {
  if (remaining === 0) {
    return 'No characters left';
  }
  if (remaining === 1) {
    return '1 character left';
  }
  return `${remaining} characters left`;
}

function coverActionLabelOf(hasImage: boolean) {
  if (hasImage) {
    return 'Change cover image';
  }
  return 'Upload cover image';
}

function CoverImage() {
  const [{ files }, { removeFile, openFileDialog, getInputProps }] =
    useFileUpload({ accept: 'image/*' });
  const currentFile = files[0];
  const preview = currentFile?.preview;
  const hasImage = Boolean(preview);
  const coverStyle = { backgroundImage: `url(${preview})` };

  function removeCover() {
    removeFile(currentFile.id);
  }

  return (
    <div className='bg-foreground/[0.05] relative h-32 overflow-hidden'>
      {hasImage && (
        <div
          role='img'
          aria-label='Cover image'
          style={coverStyle}
          className='size-full bg-cover bg-center'
        />
      )}
      <div className='absolute inset-0 flex items-center justify-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size='icon'
          onClick={openFileDialog}
          aria-label={coverActionLabelOf(hasImage)}
        >
          <ImagePlusIcon />
        </Button>
        {hasImage && (
          <Button
            type='button'
            variant='outline'
            size='icon'
            onClick={removeCover}
            aria-label='Remove cover image'
          >
            <XIcon />
          </Button>
        )}
      </div>
      <input
        {...getInputProps()}
        className='sr-only'
        aria-label='Upload cover image file'
      />
    </div>
  );
}

function ProfilePicture() {
  const [{ files }, { openFileDialog, getInputProps }] = useFileUpload({
    accept: 'image/*',
  });
  const preview = files[0]?.preview;

  return (
    <div className='relative -mt-10 size-20'>
      <Avatar className='ring-card size-20 text-base ring-4'>
        <AvatarImage src={preview} alt='Profile picture' />
        <AvatarFallback>AO</AvatarFallback>
      </Avatar>
      <Button
        type='button'
        variant='outline'
        size='icon'
        onClick={openFileDialog}
        aria-label='Change profile picture'
        className='absolute inset-0 m-auto'
      >
        <ImagePlusIcon />
      </Button>
      <input
        {...getInputProps()}
        className='sr-only'
        aria-label='Upload profile picture file'
      />
    </div>
  );
}

export default function Dialog19() {
  const id = useId();
  const firstNameId = `${id}-first-name`;
  const lastNameId = `${id}-last-name`;
  const usernameId = `${id}-username`;
  const websiteId = `${id}-website`;
  const bioId = `${id}-bio`;
  const counterId = `${id}-counter`;
  const { value, characterCount, handleChange, maxLength } = useCharacterLimit({
    maxLength: BIO_MAX_LENGTH,
    initialValue: INITIAL_BIO,
  });
  const remaining = maxLength - characterCount;

  return (
    <Dialog>
      <DialogTrigger render={<Button variant='outline' />}>
        Edit profile
      </DialogTrigger>
      <DialogContent
        animateSize={false}
        className='overflow-hidden p-0'
        contentClassName='max-h-[calc(100dvh-2rem)] gap-0'
      >
        <DialogHeader className='px-6 pt-6 pr-12 pb-4'>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription className='sr-only'>
            Change your pictures, your name, your username and your biography.
          </DialogDescription>
        </DialogHeader>
        <div className='min-h-0 flex-1 overflow-y-auto'>
          <CoverImage />
          <div className='px-6'>
            <ProfilePicture />
          </div>
          <form className='flex flex-col gap-4 px-6 pt-4 pb-6'>
            <div className='flex flex-col gap-4 sm:flex-row'>
              <div className='grid flex-1 gap-2'>
                <Label htmlFor={firstNameId}>First name</Label>
                <Input
                  id={firstNameId}
                  autoComplete='given-name'
                  defaultValue='Amara'
                  required
                />
              </div>
              <div className='grid flex-1 gap-2'>
                <Label htmlFor={lastNameId}>Last name</Label>
                <Input
                  id={lastNameId}
                  autoComplete='family-name'
                  defaultValue='Okafor'
                  required
                />
              </div>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor={usernameId}>Username</Label>
              <div className='relative'>
                <Input
                  id={usernameId}
                  autoComplete='username'
                  defaultValue='amara-okafor'
                  aria-describedby={`${usernameId}-status`}
                  className='peer pe-8'
                  required
                />
                <span className='pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2.5 peer-disabled:opacity-50'>
                  <CheckIcon className='text-success-foreground size-4' />
                </span>
                <span id={`${usernameId}-status`} className='sr-only'>
                  This username is available.
                </span>
              </div>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor={websiteId}>Website</Label>
              <div className='flex'>
                <span className='text-muted-foreground bg-foreground/[0.03] hairline-ring ring-foreground/12 dark:ring-foreground/15 inline-flex items-center rounded-s-md px-2.5 text-[13px]'>
                  https://
                </span>
                <Input
                  id={websiteId}
                  type='text'
                  autoComplete='url'
                  defaultValue='amara.design'
                  placeholder='yourwebsite.com'
                  className='-ms-px rounded-s-none shadow-none focus-visible:z-10'
                />
              </div>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor={bioId}>Biography</Label>
              <Textarea
                id={bioId}
                placeholder='A few sentences about you'
                value={value}
                maxLength={maxLength}
                onChange={handleChange}
                aria-describedby={counterId}
              />
              <p
                id={counterId}
                role='status'
                className='text-muted-foreground text-end text-xs tabular-nums'
              >
                {remainingLabelOf(remaining)}
              </p>
            </div>
          </form>
        </div>
        <DialogFooter className='px-6 pt-4 pb-6'>
          <DialogClose render={<Button variant='outline' size='lg' />}>
            Cancel
          </DialogClose>
          <DialogClose render={<Button size='lg' />}>Save changes</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
