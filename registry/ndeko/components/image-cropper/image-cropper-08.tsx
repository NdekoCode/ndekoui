'use client';

import {
  type SpringOptions,
  useMotionValueEvent,
  useSpring,
} from 'motion/react';
import { useState, useSyncExternalStore } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from '@/registry/ndeko/ui/cropper';
import { Slider } from '@/registry/ndeko/ui/slider';

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

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const ZOOM_LABELS = ['Zoom'];
const ZOOM_SPRING: SpringOptions = { stiffness: 400, damping: 40 };

function firstValueOf(value: number | readonly number[]) {
  if (typeof value === 'number') {
    return value;
  }
  return value[0];
}

function zoomLabelOf(zoom: number) {
  const rounded = zoom.toFixed(1);
  const shortest = Number.parseFloat(rounded);
  return `${shortest}x`;
}

export default function ImageCropper08() {
  const image = usePlaceholderImage();
  const shouldReduceMotion = usePrefersReducedMotion();
  const [targetZoom, setTargetZoom] = useState(MIN_ZOOM);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const zoomSpring = useSpring(MIN_ZOOM, ZOOM_SPRING);

  useMotionValueEvent(zoomSpring, 'change', setZoom);

  function changeZoomFromSlider(value: number | readonly number[]) {
    const nextZoom = firstValueOf(value);
    setTargetZoom(nextZoom);
    if (shouldReduceMotion) {
      zoomSpring.jump(nextZoom);
      setZoom(nextZoom);
      return;
    }
    zoomSpring.set(nextZoom);
  }

  function followCropperZoom(nextZoom: number) {
    setTargetZoom(nextZoom);
    zoomSpring.jump(nextZoom);
    setZoom(nextZoom);
  }

  return (
    <div className='flex w-full flex-col gap-4'>
      {image && (
        <Cropper
          className='h-80'
          image={image}
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          onZoomChange={followCropperZoom}
        >
          <CropperDescription />
          <CropperImage />
          <CropperCropArea />
        </Cropper>
      )}
      {!image && (
        <div
          aria-hidden='true'
          className='bg-foreground/[0.04] h-80 w-full rounded-xl'
        />
      )}
      <div className='mx-auto flex w-full max-w-80 items-center gap-3'>
        <Slider
          value={targetZoom}
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={ZOOM_STEP}
          onValueChange={changeZoomFromSlider}
          thumbLabels={ZOOM_LABELS}
        />
        <output className='w-10 shrink-0 text-right text-[13px] font-medium tabular-nums'>
          {zoomLabelOf(targetZoom)}
        </output>
      </div>
    </div>
  );
}
