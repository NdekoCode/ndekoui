'use client';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PadlockIcon,
  PanelLeftIcon,
  PlusIcon,
  RefreshCwIcon,
  ShareBoxIcon,
} from '@/registry/ndeko/lib/icons';

export type SafariMode = 'simple' | 'full';

export type SafariProps = Omit<ComponentProps<'figure'>, 'children'> & {
  url?: string;
  imageSrc?: string;
  videoSrc?: string;
  alt?: string;
  mode?: SafariMode;
  aspectRatio?: number;
  label?: string;
  children?: ReactNode;
};

const DEFAULT_URL = 'example.com';

const DEFAULT_ASPECT_RATIO = 16 / 10;

const PROTOCOL_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;

const TRAILING_SLASH_PATTERN = /\/$/;

const TRAFFIC_LIGHTS = [
  { name: 'close', color: 'hsl(3 100% 67%)' },
  { name: 'minimize', color: 'hsl(41 99% 59%)' },
  { name: 'zoom', color: 'hsl(129 67% 47%)' },
];

const MEDIA_FADE_SECONDS = 0.24;

const MEDIA_ENTER = {
  duration: MEDIA_FADE_SECONDS,
  ease: [0.23, 1, 0.32, 1],
} as const;

const MEDIA_EXIT = { duration: 0, delay: MEDIA_FADE_SECONDS } as const;

const TOOLBAR_HEIGHT: Record<SafariMode, string> = {
  simple: 'h-11',
  full: 'h-[52px]',
};

function displayUrlOf(url: string) {
  const withoutProtocol = url.replace(PROTOCOL_PATTERN, '');
  return withoutProtocol.replace(TRAILING_SLASH_PATTERN, '');
}

function contentRatioOf(
  aspectRatio: number | undefined,
  hasMedia: boolean,
  hasChildren: boolean
) {
  if (aspectRatio !== undefined) {
    return aspectRatio;
  }
  if (hasMedia) {
    return DEFAULT_ASPECT_RATIO;
  }
  if (hasChildren) {
    return undefined;
  }
  return DEFAULT_ASPECT_RATIO;
}

function ignoreRefusedPlayback() {
  return undefined;
}

function TrafficLights() {
  return (
    <span className='flex shrink-0 items-center gap-2'>
      {TRAFFIC_LIGHTS.map((light) => (
        <span
          key={light.name}
          className='size-3 rounded-full shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.14)]'
          style={{ backgroundColor: light.color }}
        />
      ))}
    </span>
  );
}

function ToolbarGlyph({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex size-7 shrink-0 items-center justify-center [&_svg]:size-4',
        className
      )}
    >
      {children}
    </span>
  );
}

function AddressField({ url }: { url: string }) {
  return (
    <span className='bg-foreground/[0.05] dark:bg-foreground/[0.08] flex h-[30px] min-w-0 items-center gap-1.5 rounded-lg px-2.5'>
      {/* Balances the reload glyph so the address sits in the middle of the field, as Safari centres it. */}
      <span className='size-3.5 shrink-0' />
      <span className='flex min-w-0 flex-1 items-center justify-center gap-1'>
        <PadlockIcon className='text-muted-foreground size-3 shrink-0' />
        <span className='text-foreground truncate text-[13px] leading-none'>
          {url}
        </span>
      </span>
      <RefreshCwIcon className='text-muted-foreground size-3.5 shrink-0' />
    </span>
  );
}

function Toolbar({ url, mode }: { url: string; mode: SafariMode }) {
  const isFull = mode === 'full';

  return (
    <div
      aria-hidden='true'
      className={cn(
        'hairline-b border-border bg-foreground/[0.03] dark:bg-foreground/[0.05] grid grid-cols-[minmax(max-content,1fr)_minmax(0,30rem)_minmax(max-content,1fr)] items-center gap-3 pr-3 pl-5 select-none dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]',
        TOOLBAR_HEIGHT[mode]
      )}
    >
      <span className='text-muted-foreground flex items-center gap-5'>
        <TrafficLights />
        {isFull && (
          <span className='flex items-center'>
            <ToolbarGlyph className='mr-2 @max-xl:hidden'>
              <PanelLeftIcon />
            </ToolbarGlyph>
            <ToolbarGlyph>
              <ChevronLeftIcon />
            </ToolbarGlyph>
            <ToolbarGlyph className='opacity-40 @max-md:hidden'>
              <ChevronRightIcon />
            </ToolbarGlyph>
          </span>
        )}
      </span>
      <AddressField url={url} />
      <span className='text-muted-foreground flex items-center justify-end'>
        {isFull && (
          <>
            <ToolbarGlyph className='@max-xl:hidden'>
              <ShareBoxIcon />
            </ToolbarGlyph>
            <ToolbarGlyph className='@max-md:hidden'>
              <PlusIcon />
            </ToolbarGlyph>
            <ToolbarGlyph className='@max-md:hidden'>
              <CopyIcon />
            </ToolbarGlyph>
          </>
        )}
      </span>
    </div>
  );
}

function WindowVideo({ src, alt }: { src: string; alt: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isDecorative = alt === '';
  const showsControls = Boolean(shouldReduceMotion);
  const isHidden = isDecorative && !showsControls;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (shouldReduceMotion) {
      video.pause();
      return;
    }
    const playback = video.play();
    playback.catch(ignoreRefusedPlayback);
  }, [shouldReduceMotion]);

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      loop
      playsInline
      preload='metadata'
      controls={showsControls}
      aria-label={alt || undefined}
      aria-hidden={isHidden || undefined}
      className='size-full object-cover object-top'
    />
  );
}

function WindowMedia({
  imageSrc,
  videoSrc,
  alt,
}: {
  imageSrc?: string;
  videoSrc?: string;
  alt: string;
}) {
  const mediaKey = videoSrc ?? imageSrc;
  const hasVideo = videoSrc !== undefined;
  const hasImage = imageSrc !== undefined;
  const showsImage = hasImage && !hasVideo;

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={mediaKey}
        className='absolute inset-0'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: MEDIA_ENTER }}
        exit={{ opacity: 0, transition: MEDIA_EXIT }}
      >
        {hasVideo && <WindowVideo src={videoSrc} alt={alt} />}
        {showsImage && (
          // eslint-disable-next-line @next/next/no-img-element -- registry items land in any React app, where next/image may not exist
          <img
            src={imageSrc}
            alt={alt}
            draggable={false}
            className='size-full object-cover object-top'
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function Safari({
  url = DEFAULT_URL,
  imageSrc,
  videoSrc,
  alt = '',
  mode = 'full',
  aspectRatio,
  label,
  className,
  children,
  ...props
}: SafariProps) {
  const displayUrl = displayUrlOf(url);
  const figureLabel = label ?? `Browser window at ${displayUrl}`;
  const hasMedia = Boolean(imageSrc || videoSrc);
  const hasChildren = children !== undefined && children !== null;
  const contentRatio = contentRatioOf(aspectRatio, hasMedia, hasChildren);
  const hasFixedHeight = contentRatio !== undefined;

  return (
    <figure
      aria-label={figureLabel}
      className={cn(
        'bg-card text-card-foreground hairline-ring ring-foreground/10 @container relative w-full overflow-hidden rounded-xl shadow-xl shadow-black/8',
        className
      )}
      {...props}
    >
      <Toolbar url={displayUrl} mode={mode} />
      <div
        className='bg-background text-foreground relative'
        style={{ aspectRatio: contentRatio }}
      >
        {hasMedia && (
          <WindowMedia imageSrc={imageSrc} videoSrc={videoSrc} alt={alt} />
        )}
        {hasChildren && (
          <div
            className={cn(
              'relative',
              hasFixedHeight &&
                'absolute inset-0 [scrollbar-width:thin] overflow-y-auto overscroll-contain'
            )}
          >
            {children}
          </div>
        )}
      </div>
    </figure>
  );
}
