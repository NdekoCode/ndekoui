'use client';

import {
  type SpringOptions,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { useFileUpload } from '@/registry/ndeko/hooks/use-file-upload';
import {
  ArrowLeftIcon,
  CircleUserRoundIcon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from '@/registry/ndeko/ui/cropper';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/registry/ndeko/ui/dialog';
import { Slider } from '@/registry/ndeko/ui/slider';

type Area = { x: number; y: number; width: number; height: number };

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const ZOOM_LABELS = ['Zoom'];
const ZOOM_SPRING: SpringOptions = { stiffness: 400, damping: 40 };

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

function firstValueOf(value: number | readonly number[]) {
  if (typeof value === 'number') {
    return value;
  }
  return value[0];
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', reject);
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

function blobOf(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
}

async function cropImage(imageUrl: string, area: Area) {
  const image = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = area.width;
  canvas.height = area.height;
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    area.width,
    area.height
  );
  return blobOf(canvas);
}

async function croppedBlobOf(imageUrl: string, area: Area) {
  try {
    return await cropImage(imageUrl, area);
  } catch {
    return null;
  }
}

export default function ImageCropper01() {
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cropArea, setCropArea] = useState<Area | null>(null);
  const [targetZoom, setTargetZoom] = useState(MIN_ZOOM);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const applyButtonRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const zoomSpring = useSpring(MIN_ZOOM, ZOOM_SPRING);

  useMotionValueEvent(zoomSpring, 'change', setZoom);

  function jumpToZoom(nextZoom: number) {
    setTargetZoom(nextZoom);
    zoomSpring.jump(nextZoom);
    setZoom(nextZoom);
  }

  function startCropping() {
    setCropArea(null);
    jumpToZoom(MIN_ZOOM);
    setIsDialogOpen(true);
  }

  const [
    { files, isDragging },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    accept: 'image/*',
    onFilesAdded: startCropping,
  });

  const previewUrl = files[0]?.preview;
  const hasCroppedImage = Boolean(croppedUrl);

  useEffect(() => {
    if (!croppedUrl) {
      return;
    }
    return () => URL.revokeObjectURL(croppedUrl);
  }, [croppedUrl]);

  function closeDialog() {
    setIsDialogOpen(false);
  }

  function changeZoomFromSlider(value: number | readonly number[]) {
    const nextZoom = firstValueOf(value);
    if (shouldReduceMotion) {
      jumpToZoom(nextZoom);
      return;
    }
    setTargetZoom(nextZoom);
    zoomSpring.set(nextZoom);
  }

  function removeCroppedImage() {
    setCroppedUrl(null);
  }

  async function applyCrop() {
    if (!previewUrl || !cropArea) {
      closeDialog();
      return;
    }
    const blob = await croppedBlobOf(previewUrl, cropArea);
    closeDialog();
    if (!blob) {
      return;
    }
    const nextUrl = URL.createObjectURL(blob);
    setCroppedUrl(nextUrl);
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
          data-filled={presenceOf(hasCroppedImage)}
          aria-label={avatarActionOf(hasCroppedImage)}
        >
          {croppedUrl && (
            <div
              role='img'
              aria-label='Your avatar'
              className='size-full bg-cover bg-center'
              style={backgroundOf(croppedUrl)}
            />
          )}
          {!croppedUrl && <CircleUserRoundIcon className={AVATAR_ICON} />}
        </button>
        {hasCroppedImage && (
          <Button
            size='icon'
            onClick={removeCroppedImage}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          showCloseButton={false}
          initialFocus={applyButtonRef}
          className='gap-0 p-0 sm:max-w-140'
        >
          <DialogDescription className='sr-only'>
            Drag the image and zoom to choose the part to keep.
          </DialogDescription>
          <div className='flex items-center justify-between gap-2 p-4'>
            <div className='flex items-center gap-2'>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground -my-1'
                onClick={closeDialog}
                aria-label='Cancel'
              >
                <ArrowLeftIcon />
              </Button>
              <DialogTitle className='text-base'>Crop image</DialogTitle>
            </div>
            <Button
              ref={applyButtonRef}
              className='-my-1'
              onClick={applyCrop}
              disabled={!previewUrl}
            >
              Apply
            </Button>
          </div>
          {previewUrl && (
            <Cropper
              className='h-96 rounded-none sm:h-120'
              image={previewUrl}
              zoom={zoom}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              onCropChange={setCropArea}
              onZoomChange={jumpToZoom}
            >
              <CropperDescription />
              <CropperImage />
              <CropperCropArea />
            </Cropper>
          )}
          <div className='px-4 py-6'>
            <div className='mx-auto flex w-full max-w-80 items-center gap-4'>
              <ZoomOutIcon
                className='text-muted-foreground size-4 shrink-0'
                aria-hidden='true'
              />
              <Slider
                value={targetZoom}
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={ZOOM_STEP}
                onValueChange={changeZoomFromSlider}
                thumbLabels={ZOOM_LABELS}
              />
              <ZoomInIcon
                className='text-muted-foreground size-4 shrink-0'
                aria-hidden='true'
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
