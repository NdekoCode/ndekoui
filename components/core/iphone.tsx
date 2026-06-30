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

export type IphoneFinish = 'natural' | 'black' | 'white';

export type IphoneStatusBar = 'auto' | 'light' | 'dark';

export type IphoneProps = Omit<ComponentProps<'figure'>, 'children'> & {
  imageSrc?: string;
  videoSrc?: string;
  alt?: string;
  finish?: IphoneFinish;
  statusBar?: IphoneStatusBar;
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
  side: 'left' | 'right';
  top: number;
  height: number;
};

/* Geometry in points of a 6.3 inch iPhone with a Dynamic Island: a 402 by 874 screen. */
const DEVICE = { width: 438, height: 904 };

const FRAME = { x: 3, y: 0, width: 432, height: 904, radius: 72 };

const GLASS = { x: 10, y: 7, width: 418, height: 890, radius: 65 };

const SCREEN = { x: 18, y: 15, width: 402, height: 874, radius: 57 };

const ISLAND = { top: 11, width: 124, height: 36, lens: 11 };

const SAFE_AREA = { top: 58, bottom: 34 };

const HOME_INDICATOR = { bottom: 8, width: 138, height: 5 };

const BUTTON_DEPTH = 4;

const SIDE_BUTTONS: SideButton[] = [
  { id: 'action', side: 'left', top: 172, height: 36 },
  { id: 'volume-up', side: 'left', top: 250, height: 62 },
  { id: 'volume-down', side: 'left', top: 326, height: 62 },
  { id: 'side', side: 'right', top: 254, height: 100 },
];

const ANTENNA_LINES = [96, 808];

const UNIT = '--iphone-unit';

const FINISHES: Record<IphoneFinish, Palette> = {
  natural: {
    highlight: 'hsl(40 10% 86%)',
    base: 'hsl(36 6% 67%)',
    shade: 'hsl(32 5% 47%)',
    edge: 'hsl(30 5% 35%)',
  },
  black: {
    highlight: 'hsl(220 4% 46%)',
    base: 'hsl(220 4% 27%)',
    shade: 'hsl(220 5% 16%)',
    edge: 'hsl(220 6% 9%)',
  },
  white: {
    highlight: 'hsl(40 16% 98%)',
    base: 'hsl(40 9% 89%)',
    shade: 'hsl(36 5% 73%)',
    edge: 'hsl(36 4% 60%)',
  },
};

const STATUS_TONE: Record<IphoneStatusBar, string> = {
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

function unit(value: number) {
  return `calc(var(${UNIT}) * ${value})`;
}

function svgIdOf(reactId: string, part: string) {
  const safeId = reactId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `iphone-${safeId}-${part}`;
}

function buttonXOf(button: SideButton) {
  if (button.side === 'left') {
    return FRAME.x - BUTTON_DEPTH + 1;
  }
  return FRAME.x + FRAME.width - 1;
}

function buttonGradientOf(
  button: SideButton,
  leftGradientId: string,
  rightGradientId: string
) {
  if (button.side === 'left') {
    return leftGradientId;
  }
  return rightGradientId;
}

function contentStyleOf(safeArea: boolean) {
  if (safeArea) {
    return SAFE_AREA_STYLE;
  }
  return undefined;
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
  top: unit(ISLAND.top),
  height: unit(ISLAND.height),
};

const STATUS_ZONE_WIDTH = (SCREEN.width - ISLAND.width) / 2;

const ISLAND_STYLE: CSSProperties = {
  top: unit(ISLAND.top),
  width: unit(ISLAND.width),
  height: unit(ISLAND.height),
};

const LENS_STYLE: CSSProperties = {
  right: unit(ISLAND.height / 2 - ISLAND.lens / 2),
  width: unit(ISLAND.lens),
  height: unit(ISLAND.lens),
  boxShadow: `inset 0 0 0 ${unit(1.5)} hsl(230 12% 14%)`,
};

const HOME_INDICATOR_STYLE: CSSProperties = {
  bottom: unit(HOME_INDICATOR.bottom),
  width: unit(HOME_INDICATOR.width),
  height: unit(HOME_INDICATOR.height),
};

const SAFE_AREA_STYLE: CSSProperties = {
  paddingTop: unit(SAFE_AREA.top),
  paddingBottom: unit(SAFE_AREA.bottom),
};

function Hardware({ finish }: { finish: IphoneFinish }) {
  const reactId = useId();
  const rimId = svgIdOf(reactId, 'rim');
  const leftButtonId = svgIdOf(reactId, 'left-button');
  const rightButtonId = svgIdOf(reactId, 'right-button');
  const palette = FINISHES[finish];
  const viewBox = `0 0 ${DEVICE.width} ${DEVICE.height}`;

  return (
    <svg
      aria-hidden='true'
      viewBox={viewBox}
      fill='none'
      className='absolute inset-0 size-full'
    >
      <defs>
        <linearGradient id={rimId} x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stopColor={palette.highlight} />
          <stop offset='0.14' stopColor={palette.base} />
          <stop offset='0.4' stopColor={palette.shade} />
          <stop offset='0.55' stopColor={palette.base} />
          <stop offset='0.78' stopColor={palette.highlight} />
          <stop offset='1' stopColor={palette.shade} />
        </linearGradient>
        <linearGradient id={leftButtonId} x1='0' y1='0' x2='1' y2='0'>
          <stop offset='0' stopColor={palette.shade} />
          <stop offset='0.45' stopColor={palette.highlight} />
          <stop offset='1' stopColor={palette.base} />
        </linearGradient>
        <linearGradient id={rightButtonId} x1='1' y1='0' x2='0' y2='0'>
          <stop offset='0' stopColor={palette.shade} />
          <stop offset='0.45' stopColor={palette.highlight} />
          <stop offset='1' stopColor={palette.base} />
        </linearGradient>
      </defs>
      {SIDE_BUTTONS.map((button) => {
        const gradientId = buttonGradientOf(
          button,
          leftButtonId,
          rightButtonId
        );

        return (
          <rect
            key={button.id}
            x={buttonXOf(button)}
            y={button.top}
            width={BUTTON_DEPTH}
            height={button.height}
            rx={1.75}
            fill={`url(#${gradientId})`}
            stroke={palette.edge}
            strokeOpacity={0.45}
            strokeWidth={0.5}
          />
        );
      })}
      <rect
        x={FRAME.x}
        y={FRAME.y}
        width={FRAME.width}
        height={FRAME.height}
        rx={FRAME.radius}
        fill={`url(#${rimId})`}
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
        x={FRAME.x + 2}
        y={FRAME.y + 2}
        width={FRAME.width - 4}
        height={FRAME.height - 4}
        rx={FRAME.radius - 2}
        stroke={palette.highlight}
        strokeOpacity={0.55}
        strokeWidth={0.75}
      />
      {ANTENNA_LINES.map((top) => (
        <g key={top} fill={palette.shade} fillOpacity={0.55}>
          <rect x={FRAME.x} y={top} width={GLASS.x - FRAME.x} height={2.5} />
          <rect
            x={GLASS.x + GLASS.width}
            y={top}
            width={GLASS.x - FRAME.x}
            height={2.5}
          />
        </g>
      ))}
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
        strokeOpacity={0.07}
        strokeWidth={0.75}
      />
    </svg>
  );
}

function CellularGlyph() {
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 17 11'
      fill='currentColor'
      style={{ width: unit(17), height: unit(11) }}
    >
      <rect x='0' y='7' width='3' height='4' rx='0.9' />
      <rect x='4.6' y='4.7' width='3' height='6.3' rx='0.9' />
      <rect x='9.2' y='2.4' width='3' height='8.6' rx='0.9' />
      <rect x='13.8' y='0' width='3' height='11' rx='0.9' />
    </svg>
  );
}

function WifiGlyph() {
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 15.5 11'
      fill='currentColor'
      stroke='currentColor'
      strokeWidth='0.5'
      strokeLinejoin='round'
      style={{ width: unit(15.5), height: unit(11) }}
    >
      <path d='M0.962 3.612A9.6 9.6 0 0 1 14.538 3.612L12.629 5.521A6.9 6.9 0 0 0 2.871 5.521Z' />
      <path d='M3.79 6.44A5.6 5.6 0 0 1 11.71 6.44L10.013 8.137A3.2 3.2 0 0 0 5.487 8.137Z' />
      <path d='M7.75 10.4L6.406 9.056A1.9 1.9 0 0 1 9.094 9.056Z' />
    </svg>
  );
}

function BatteryGlyph() {
  const levelWidth = 18.5 * BATTERY_LEVEL;

  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 25 12'
      fill='none'
      style={{ width: unit(25), height: unit(12) }}
    >
      <rect
        x='0.5'
        y='0.5'
        width='21.5'
        height='11'
        rx='3.4'
        stroke='currentColor'
        strokeOpacity='0.38'
      />
      <rect
        x='2'
        y='2'
        width={levelWidth}
        height='8'
        rx='2'
        fill='currentColor'
      />
      <path
        d='M23.2 4.1V7.9C24 7.6 24.5 6.85 24.5 6S24 4.4 23.2 4.1Z'
        fill='currentColor'
        fillOpacity='0.4'
      />
    </svg>
  );
}

function StatusBar({ time, toneClass }: { time: string; toneClass: string }) {
  const zoneStyle = { width: unit(STATUS_ZONE_WIDTH) };

  return (
    <div
      aria-hidden='true'
      className={cn(
        'pointer-events-none absolute inset-x-0 flex items-center justify-between transition-colors duration-200 select-none',
        toneClass
      )}
      style={STATUS_BAR_STYLE}
    >
      <span
        className='flex justify-center'
        style={{ ...zoneStyle, paddingRight: unit(8) }}
      >
        <span
          className='leading-none font-semibold tabular-nums'
          style={{ fontSize: unit(17) }}
        >
          {time}
        </span>
      </span>
      <span
        className='flex items-center justify-center'
        style={{ ...zoneStyle, paddingLeft: unit(8), gap: unit(5) }}
      >
        <CellularGlyph />
        <WifiGlyph />
        <BatteryGlyph />
      </span>
    </div>
  );
}

function DynamicIsland() {
  return (
    <div
      aria-hidden='true'
      className='pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center rounded-full bg-black'
      style={ISLAND_STYLE}
    >
      <span
        className='absolute top-1/2 -translate-y-1/2 rounded-full bg-[hsl(230_18%_8%)]'
        style={LENS_STYLE}
      />
    </div>
  );
}

function HomeIndicator({ toneClass }: { toneClass: string }) {
  return (
    <div
      aria-hidden='true'
      className={cn(
        'pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full bg-current opacity-90 transition-colors duration-200',
        toneClass
      )}
      style={HOME_INDICATOR_STYLE}
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

export function Iphone({
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
}: IphoneProps) {
  const hasMedia = Boolean(imageSrc || videoSrc);
  const hasChildren = children !== undefined && children !== null;
  const toneClass = STATUS_TONE[statusBar];
  const contentStyle = contentStyleOf(safeArea);

  return (
    <figure
      aria-label={label}
      className={cn('@container relative w-full max-w-[438px]', className)}
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
        <DynamicIsland />
        <HomeIndicator toneClass={toneClass} />
      </div>
    </figure>
  );
}
