'use client';

import { useEffect, useId, useRef } from 'react';

import { ImageUpIcon } from '@/registry/ndeko/lib/icons';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import { PHOTO_MAX_BYTES, PHOTO_TYPES } from './data';
import { describedByOf, ErrorPresence, SettingsRow } from './settings-kit';

const PHOTO_ACCEPT = PHOTO_TYPES.join(',');

function photoProblemOf(file: File) {
  const isAllowedType = PHOTO_TYPES.includes(file.type);
  if (!isAllowedType) {
    return 'Pick a PNG, JPEG or WebP image';
  }
  const isSmallEnough = file.size <= PHOTO_MAX_BYTES;
  if (!isSmallEnough) {
    return 'Pick an image under 2 MB';
  }
  return null;
}

type PhotoRowProps = {
  photo: string;
  initials: string;
  error: string | null;
  onPhotoChange: (photo: string) => void;
  onError: (error: string | null) => void;
};

/** The picked image stays in the browser as an object URL; nothing is uploaded. */
export function PhotoRow({
  photo,
  initials,
  error,
  onPhotoChange,
  onError,
}: PhotoRowProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const createdUrlsRef = useRef<string[]>([]);
  const errorId = useId();
  const hasPhoto = photo.length > 0;
  const hasError = Boolean(error);
  const describedBy = describedByOf(hasError, errorId);

  useEffect(() => {
    const createdUrls = createdUrlsRef.current;
    return () => {
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function openPicker() {
    pickerRef.current?.click();
  }

  function pickPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    const problem = photoProblemOf(file);
    onError(problem);
    if (problem) {
      return;
    }
    const url = URL.createObjectURL(file);
    createdUrlsRef.current.push(url);
    onPhotoChange(url);
  }

  function removePhoto() {
    onError(null);
    onPhotoChange('');
  }

  return (
    <SettingsRow
      label='Photo'
      line='PNG, JPEG or WebP under 2 MB, shown on your tasks and comments'
    >
      <div className='flex items-center gap-3'>
        <Avatar className='size-11 text-sm'>
          {hasPhoto && <AvatarImage src={photo} alt='' />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <Button
          variant='outline'
          size='sm'
          aria-describedby={describedBy}
          onClick={openPicker}
        >
          <ImageUpIcon />
          Upload photo
        </Button>
        {hasPhoto && (
          <Button variant='ghost' size='sm' onClick={removePhoto}>
            Remove
          </Button>
        )}
        <input
          ref={pickerRef}
          type='file'
          accept={PHOTO_ACCEPT}
          tabIndex={-1}
          aria-hidden='true'
          onChange={pickPhoto}
          className='sr-only'
        />
      </div>
      <ErrorPresence id={errorId} error={error} />
    </SettingsRow>
  );
}

type BioRowProps = {
  value: string;
  maxLength: number;
  onValueChange: (value: string) => void;
};

export function BioRow({ value, maxLength, onValueChange }: BioRowProps) {
  const fieldId = useId();
  const countId = useId();
  const countText = `${value.length} of ${maxLength}`;

  function changeValue(event: React.ChangeEvent<HTMLTextAreaElement>) {
    onValueChange(event.target.value);
  }

  return (
    <div className='flex flex-col gap-2 px-4 py-3'>
      <div className='flex items-baseline justify-between gap-3'>
        <label htmlFor={fieldId} className='text-[13px] font-medium'>
          Bio
        </label>
        <span
          id={countId}
          className='text-muted-foreground text-xs tabular-nums'
        >
          {countText}
        </span>
      </div>
      <p className='text-muted-foreground -mt-1.5 text-xs'>
        Two lines on your profile card, plain text
      </p>
      <Textarea
        id={fieldId}
        value={value}
        rows={2}
        maxLength={maxLength}
        aria-describedby={countId}
        onChange={changeValue}
      />
    </div>
  );
}
