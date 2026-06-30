'use client';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react';

export type AndroidFinish = 'natural' | 'black' | 'white';

export type AndroidStatusBar = 'auto' | 'light' | 'dark';

export type AndroidProps = Omit<ComponentProps<'figure'>, 'children'> & {
  imageSrc?: string;
  videoSrc?: string;
  alt?: string;
  finish?: AndroidFinish;
  statusBar?: AndroidStatusBar;
  time?: string;
  safeArea?: boolean;
  label?: string;
  children?: ReactNode;
};

type Palette = {
  highlight: string;
  base: string;
  shade: string;
  edge: string;
};

type SideButton = {
  id: string;
  top: number;
  height: number;
};

/* Geometry in density-independent pixels of a 6.3 inch phone with a 412 by 915 screen and even bezels. */
const DEVICE = { width: 450, height: 947 };

const FRAME = { x: 3, y: 0, width: 444, height: 947, radius: 62 };

const GLASS = { x: 9, y: 6, width: 432, height: 935, radius: 56 };

const SCREEN = { x: 19, y: 16, width: 412, height: 915, radius: 46 };

const CAMERA = { centerY: 22, diameter: 22, lens: 10 };

const STATUS_BAR = { height: 44, inset: 26 };

const SAFE_AREA = { top: 44, bottom: 24 };

const GESTURE_BAR = { bottom: 9, width: 108, height: 4.5 };

const BUTTON_DEPTH = 3.5;

const SIDE_BUTTONS: SideButton[] = [
  { id: 'power', top: 206, height: 58 },
  { id: 'volume', top: 296, height: 112 },
];

const UNIT = '--android-unit';

const FINISHES: Record<AndroidFinish, Palette> = {
  natural: {
    highlight: 'hsl(210 8% 88%)',
    base: 'hsl(210 5% 74%)',
    shade: 'hsl(210 4% 58%)',
    edge: 'hsl(210 4% 44%)',
  },
  black: {
    highlight: 'hsl(220 5% 34%)',
    base: 'hsl(220 5% 21%)',
    shade: 'hsl(220 6% 13%)',
    edge: 'hsl(220 8% 7%)',
  },
  white: {
    highlight: 'hsl(45 30% 98%)',
    base: 'hsl(42 18% 90%)',
    shade: 'hsl(40 9% 77%)',
    edge: 'hsl(40 6% 63%)',
  },
};

const STATUS_TONE: Record<AndroidStatusBar, string> = {
  auto: 'text-foreground',
  light: 'text-white',
  dark: 'text-black',
};

const GLASS_FILL = 'hsl(240 8% 3%)';

const MEDIA_FADE_SECONDS = 0.24;

const MEDIA_ENTER = {
  duration: MEDIA_FADE_SECONDS,
  ease: [0.23, 1, 0.32, 1],
} as const;

const MEDIA_EXIT = { duration: 0, delay: MEDIA_FADE_SECONDS } as const;

const BATTERY_LEVEL = 0.8;

const BATTERY_WIDTH = 23;

function unit(value: number) {
  return `calc(var(${UNIT}) * ${value})`;
}

function svgIdOf(reactId: string, part: string) {
  const safeId = reactId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `android-${safeId}-${part}`;
}

function contentStyleOf(safeArea: boolean) {
  if (safeArea) {
    return SAFE_AREA_STYLE;
  }
  return undefined;
}

function batteryLevelPathOf(level: number) {
  const right = BATTERY_WIDTH * level;
  return `M3.5 0H${right}V12H3.5A3.5 3.5 0 0 1 0 8.5V3.5A3.5 3.5 0 0 1 3.5 0Z`;
}

function ignoreRefusedPlayback() {
  return undefined;
}

const ROOT_STYLE = {
  [UNIT]: `calc(100cqw / ${DEVICE.width})`,
  aspectRatio: `${DEVICE.width} / ${DEVICE.height}`,
} as CSSProperties;

const SHADOW_STYLE: CSSProperties = {
  left: unit(FRAME.x),
  top: unit(FRAME.y),
  width: unit(FRAME.width),
  height: unit(FRAME.height),
  borderRadius: unit(FRAME.radius),
  boxShadow: `0 ${unit(1)} ${unit(2)} rgb(0 0 0 / 0.12), 0 ${unit(28)} ${unit(56)} ${unit(-20)} rgb(0 0 0 / 0.3)`,
};

const SCREEN_STYLE: CSSProperties = {
  left: unit(SCREEN.x),
  top: unit(SCREEN.y),
  width: unit(SCREEN.width),
  height: unit(SCREEN.height),
  borderRadius: unit(SCREEN.radius),
  clipPath: `inset(0 round ${unit(SCREEN.radius)})`,
};

const STATUS_BAR_STYLE: CSSProperties = {
  height: unit(STATUS_BAR.height),
  paddingLeft: unit(STATUS_BAR.inset),
  paddingRight: unit(STATUS_BAR.inset),
};

const CAMERA_STYLE: CSSProperties = {
  top: unit(CAMERA.centerY - CAMERA.diameter / 2),
  width: unit(CAMERA.diameter),
  height: unit(CAMERA.diameter),
  boxShadow: `0 0 0 ${unit(1)} hsl(230 6% 12%)`,
};

const LENS_STYLE: CSSProperties = {
  width: unit(CAMERA.lens),
  height: unit(CAMERA.lens),
  boxShadow: `inset 0 0 0 ${unit(1.5)} hsl(230 12% 15%)`,
};

const GESTURE_BAR_STYLE: CSSProperties = {
  bottom: unit(GESTURE_BAR.bottom),
  width: unit(GESTURE_BAR.width),
  height: unit(GESTURE_BAR.height),
};

const SAFE_AREA_STYLE: CSSProperties = {
  paddingTop: unit(SAFE_AREA.top),
  paddingBottom: unit(SAFE_AREA.bottom),
};

function Hardware({ finish }: { finish: AndroidFinish }) {
  const reactId = useId();
  const railId = svgIdOf(reactId, 'rail');
  const buttonId = svgIdOf(reactId, 'button');
  const palette = FINISHES[finish];
  const viewBox = `0 0 ${DEVICE.width} ${DEVICE.height}`;
  const buttonX = FRAME.x + FRAME.width - 1;

  return (
    <svg
      aria-hidden='true'
      viewBox={viewBox}
      fill='none'
      className='absolute inset-0 size-full'
    >
      <defs>
        <linearGradient id={railId} x1='0' y1='0' x2='0.35' y2='1'>
          <stop offset='0' stopColor={palette.highlight} />
          <stop offset='0.12' stopColor={palette.base} />
          <stop offset='0.86' stopColor={palette.base} />
          <stop offset='1' stopColor={palette.shade} />
        </linearGradient>
        <linearGradient id={buttonId} x1='1' y1='0' x2='0' y2='0'>
          <stop offset='0' stopColor={palette.shade} />
          <stop offset='0.5' stopColor={palette.highlight} />
          <stop offset='1' stopColor={palette.base} />
        </linearGradient>
      </defs>
      {SIDE_BUTTONS.map((button) => (
        <rect
          key={button.id}
          x={buttonX}
          y={button.top}
          width={BUTTON_DEPTH}
          height={button.height}
          rx={1.5}
          fill={`url(#${buttonId})`}
          stroke={palette.edge}
          strokeOpacity={0.45}
          strokeWidth={0.5}
        />
      ))}
      <rect
        x={FRAME.x}
        y={FRAME.y}
        width={FRAME.width}
        height={FRAME.height}
        rx={FRAME.radius}
        fill={`url(#${railId})`}
      />
      <rect
        x={FRAME.x + 0.25}
        y={FRAME.y + 0.25}
        width={FRAME.width - 0.5}
        height={FRAME.height - 0.5}
        rx={FRAME.radius - 0.25}
        stroke={palette.edge}
        strokeOpacity={0.7}
        strokeWidth={0.5}
      />
      <rect
        x={FRAME.x + 1.75}
        y={FRAME.y + 1.75}
        width={FRAME.width - 3.5}
        height={FRAME.height - 3.5}
        rx={FRAME.radius - 1.75}
        stroke={palette.highlight}
        strokeOpacity={0.35}
        strokeWidth={0.75}
      />
      <rect
        x={GLASS.x}
        y={GLASS.y}
        width={GLASS.width}
        height={GLASS.height}
        rx={GLASS.radius}
        fill={GLASS_FILL}
        stroke='black'
        strokeOpacity={0.6}
        strokeWidth={0.75}
      />
      <rect
        x={GLASS.x + 1}
        y={GLASS.y + 1}
        width={GLASS.width - 2}
        height={GLASS.height - 2}
        rx={GLASS.radius - 1}
        stroke='white'
        strokeOpacity={0.06}
        strokeWidth={0.75}
      />
    </svg>
  );
}

function WifiGlyph() {
  return (
    <svg
      aria-hidden='true'
      viewBox='-0.5 0 17 12.6'
      fill='currentColor'
      stroke='currentColor'
      strokeWidth='1'
      strokeLinejoin='round'
      style={{ width: unit(15), height: unit(11.1) }}
    >
      <path d='M8 12L0.01 4.01A11.3 11.3 0 0 1 15.99 4.01Z' />
    </svg>
  );
}

function CellularGlyph() {
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 16 13'
      fill='currentColor'
      stroke='currentColor'
      strokeWidth='1'
      strokeLinejoin='round'
      style={{ width: unit(13.5), height: unit(11) }}
    >
      <path d='M1 12H15V1Z' />
    </svg>
  );
}

function BatteryGlyph() {
  const levelPath = batteryLevelPathOf(BATTERY_LEVEL);

  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 26 12'
      fill='currentColor'
      style={{ width: unit(22), height: unit(10.2) }}
    >
      <rect
        x='0'
        y='0'
        width={BATTERY_WIDTH}
        height='12'
        rx='3.5'
        fillOpacity='0.3'
      />
      <path d={levelPath} />
      <rect x='24' y='4' width='2' height='4' rx='1' fillOpacity='0.3' />
    </svg>
  );
}

function StatusBar({ time, toneClass }: { time: string; toneClass: string }) {
  return (
    <div
      aria-hidden='true'
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between transition-colors duration-200 select-none',
        toneClass
      )}
      style={STATUS_BAR_STYLE}
    >
      <span
        className='leading-none font-medium tabular-nums'
        style={{ fontSize: unit(14) }}
      >
        {time}
      </span>
      <span className='flex items-center' style={{ gap: unit(6) }}>
        <WifiGlyph />
        <CellularGlyph />
        <BatteryGlyph />
      </span>
    </div>
  );
}

function PunchHoleCamera() {
  return (
    <div
      aria-hidden='true'
      className='pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full bg-black'
      style={CAMERA_STYLE}
    >
      <span className='rounded-full bg-[hsl(230_18%_8%)]' style={LENS_STYLE} />
    </div>
  );
}

function GestureBar({ toneClass }: { toneClass: string }) {
  return (
    <div
      aria-hidden='true'
      className={cn(
        'pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full bg-current opacity-80 transition-colors duration-200',
        toneClass
      )}
      style={GESTURE_BAR_STYLE}
    />
  );
}

function ScreenVideo({ src, alt }: { src: string; alt: string }) {
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
      className='size-full object-cover'
    />
  );
}

function ScreenMedia({
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
        {hasVideo && <ScreenVideo src={videoSrc} alt={alt} />}
        {showsImage && (
          // eslint-disable-next-line @next/next/no-img-element -- registry items land in any React app, where next/image may not exist
          <img
            src={imageSrc}
            alt={alt}
            draggable={false}
            className='size-full object-cover'
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function Android({
  imageSrc,
  videoSrc,
  alt = '',
  finish = 'black',
  statusBar = 'auto',
  time = '9:41',
  safeArea = true,
  label = 'Phone screen',
  className,
  style,
  children,
  ...props
}: AndroidProps) {
  const hasMedia = Boolean(imageSrc || videoSrc);
  const hasChildren = children !== undefined && children !== null;
  const toneClass = STATUS_TONE[statusBar];
  const contentStyle = contentStyleOf(safeArea);

  return (
    <figure
      aria-label={label}
      className={cn('@container relative w-full max-w-[450px]', className)}
      style={{ ...ROOT_STYLE, ...style }}
      {...props}
    >
      <div aria-hidden='true' className='absolute' style={SHADOW_STYLE} />
      <Hardware finish={finish} />
      <div
        className='bg-background text-foreground absolute overflow-hidden'
        style={SCREEN_STYLE}
      >
        {hasMedia && (
          <ScreenMedia imageSrc={imageSrc} videoSrc={videoSrc} alt={alt} />
        )}
        {hasChildren && (
          <div
            className='absolute inset-0 flex [scrollbar-width:none] flex-col overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden'
            style={contentStyle}
          >
            {children}
          </div>
        )}
        <StatusBar time={time} toneClass={toneClass} />
        <PunchHoleCamera />
        <GestureBar toneClass={toneClass} />
      </div>
    </figure>
  );
}
