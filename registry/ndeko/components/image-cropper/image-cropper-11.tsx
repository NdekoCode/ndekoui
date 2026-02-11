'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

import { Button } from '@/registry/ndeko/ui/button';
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from '@/registry/ndeko/ui/cropper';

const PLACEHOLDER_WIDTH = 1200;
const PLACEHOLDER_HEIGHT = 800;
const WASH_ALPHA = 0.35;
const BRAND_CIRCLE = { x: 840, y: 280, radius: 150, alpha: 0.45 };
const INFO_CIRCLE = { x: 360, y: 640, radius: 260, alpha: 0.3 };
const FULL_TURN = Math.PI * 2;
const THEME_ATTRIBUTES = ['class', 'style', 'data-theme'];

type Circle = typeof BRAND_CIRCLE;

type DrawnImage = { key: string; url: string | null };

let drawnImage: DrawnImage | null = null;

function tokenOf(styles: CSSStyleDeclaration, name: string) {
  const value = styles.getPropertyValue(name);
  return value.trim();
}

function fillCircle(
  context: CanvasRenderingContext2D,
  circle: Circle,
  color: string
) {
  context.globalAlpha = circle.alpha;
  context.fillStyle = color;
  context.beginPath();
  context.arc(circle.x, circle.y, circle.radius, 0, FULL_TURN);
  context.fill();
}

function drawPlaceholderImage() {
  const styles = getComputedStyle(document.documentElement);
  const base = tokenOf(styles, '--card');
  const brand = tokenOf(styles, '--primary');
  const info = tokenOf(styles, '--info');
  const canvas = document.createElement('canvas');
  canvas.width = PLACEHOLDER_WIDTH;
  canvas.height = PLACEHOLDER_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }
  context.fillStyle = base;
  context.fillRect(0, 0, PLACEHOLDER_WIDTH, PLACEHOLDER_HEIGHT);
  const wash = context.createLinearGradient(
    0,
    0,
    PLACEHOLDER_WIDTH,
    PLACEHOLDER_HEIGHT
  );
  wash.addColorStop(0, brand);
  wash.addColorStop(1, info);
  context.globalAlpha = WASH_ALPHA;
  context.fillStyle = wash;
  context.fillRect(0, 0, PLACEHOLDER_WIDTH, PLACEHOLDER_HEIGHT);
  fillCircle(context, BRAND_CIRCLE, brand);
  fillCircle(context, INFO_CIRCLE, info);
  return canvas.toDataURL('image/png');
}

function placeholderSnapshot() {
  const key = document.documentElement.className;
  const cachedImage = drawnImage;
  const isCurrent = cachedImage?.key === key;
  if (cachedImage && isCurrent) {
    return cachedImage.url;
  }
  const url = drawPlaceholderImage();
  drawnImage = { key, url };
  return url;
}

function serverSnapshot() {
  return null;
}

function subscribeToTheme(onThemeChange: () => void) {
  const observer = new MutationObserver(onThemeChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: THEME_ATTRIBUTES,
  });
  return () => observer.disconnect();
}

function usePlaceholderImage() {
  return useSyncExternalStore(
    subscribeToTheme,
    placeholderSnapshot,
    serverSnapshot
  );
}

type Area = { x: number; y: number; width: number; height: number };

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

function CroppedPreview({ url }: { url: string | null }) {
  if (url) {
    return (
      <div
        role='img'
        aria-label='Cropped result'
        className='hairline-ring ring-border aspect-square w-full shrink-0 rounded-lg bg-cover bg-center'
        style={{ backgroundImage: `url(${url})` }}
      />
    );
  }
  return (
    <div className='bg-foreground/[0.04] text-muted-foreground flex aspect-square w-full shrink-0 items-center justify-center rounded-lg p-2 text-center text-xs'>
      Image preview
    </div>
  );
}

export default function ImageCropper11() {
  const image = usePlaceholderImage();
  const [cropArea, setCropArea] = useState<Area | null>(null);
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const canCrop = cropArea !== null;

  useEffect(() => {
    if (!croppedUrl) {
      return;
    }
    return () => URL.revokeObjectURL(croppedUrl);
  }, [croppedUrl]);

  async function cropPreview() {
    if (!image || !cropArea) {
      return;
    }
    const blob = await croppedBlobOf(image, cropArea);
    if (!blob) {
      setCroppedUrl(null);
      return;
    }
    const nextUrl = URL.createObjectURL(blob);
    setCroppedUrl(nextUrl);
  }

  return (
    <div className='flex w-full flex-col gap-4 md:flex-row'>
      {image && (
        <Cropper
          className='h-64 md:flex-1'
          image={image}
          onCropChange={setCropArea}
        >
          <CropperDescription />
          <CropperImage />
          <CropperCropArea />
        </Cropper>
      )}
      {!image && (
        <div
          aria-hidden='true'
          className='bg-foreground/[0.04] h-64 w-full rounded-xl md:flex-1'
        />
      )}
      <div className='flex w-28 flex-col gap-4'>
        <Button onClick={cropPreview} disabled={!canCrop}>
          Crop preview
        </Button>
        <CroppedPreview url={croppedUrl} />
      </div>
    </div>
  );
}
