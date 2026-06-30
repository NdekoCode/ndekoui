'use client';

import createGlobe, { type COBEOptions } from 'cobe';
import { useReducedMotion } from 'motion/react';
import { useEffect, useId, useRef } from 'react';

import { cn } from '@/lib/utils';

export type GlobeLocation = [latitude: number, longitude: number];

export type GlobeMarker = {
  location: GlobeLocation;
  size?: number;
  label?: string;
};

export type GlobeArc = {
  from: GlobeLocation;
  to: GlobeLocation;
};

type Rgb = [number, number, number];

type ThemeColors = Pick<
  COBEOptions,
  'baseColor' | 'markerColor' | 'glowColor' | 'dark' | 'mapBrightness'
> & { arcColor: Rgb };

type ControllerSettings = {
  markers: GlobeMarker[];
  arcs: GlobeArc[];
  markerSize: number;
  autoRotate: boolean;
  turnDuration: number;
  reducedMotion: boolean;
};

type FocusTarget = {
  phi: number;
  theta: number;
  holds: boolean;
  hasArrived: boolean;
};

type Controller = {
  configure: (settings: ControllerSettings) => void;
  focus: (location: GlobeLocation | null) => void;
  nudge: (deltaPhi: number, deltaTheta: number) => void;
  grab: (event: PointerEvent) => void;
  drag: (event: PointerEvent) => void;
  release: (event: PointerEvent) => void;
  hold: (isHeld: boolean) => void;
  destroy: () => void;
};

const MAX_TILT = 0.9;

const GLOW_SHARE = 0.06;

const MAX_PIXEL_RATIO = 2;

const WARM_UP_FRAMES = 8;

const MOMENTUM_DECAY_MS = 420;

const FOCUS_EASE_MS = 240;

const RELEASE_STILL_MS = 80;

const MAX_SPIN = 0.012;

const MIN_SPIN = 0.00002;

const ARRIVED = 0.0005;

const FRAME_CAP_MS = 64;

const NUDGE_TURN = 0.35;

const NUDGE_TILT = 0.15;

const DEFAULT_MARKER_SIZE = 0.05;

const DEFAULT_TURN_DURATION = 40;

const FULL_TURN = Math.PI * 2;

const THREE_QUARTER_TURN = (Math.PI * 3) / 2;

const DEFAULT_SETTINGS: ControllerSettings = {
  markers: [],
  arcs: [],
  markerSize: DEFAULT_MARKER_SIZE,
  autoRotate: true,
  turnDuration: DEFAULT_TURN_DURATION,
  reducedMotion: false,
};

const MAP_BRIGHTNESS = 0.65;

const REVEAL_TRANSITION = 'opacity 600ms cubic-bezier(0.23, 1, 0.32, 1)';

function clamp(value: number, min: number, max: number) {
  const atLeastMin = Math.max(value, min);
  return Math.min(atLeastMin, max);
}

function radiansOf(degrees: number) {
  return (degrees * Math.PI) / 180;
}

/** The phi and theta that put a location at the centre of the globe, worked out from cobe's projection. */
function anglesOf([latitude, longitude]: GlobeLocation) {
  const longitudeAngle = radiansOf(longitude);
  const latitudeAngle = radiansOf(latitude);
  const phi = THREE_QUARTER_TURN - longitudeAngle;
  const theta = clamp(latitudeAngle, -MAX_TILT, MAX_TILT);
  return { phi, theta };
}

function nearestTurnOf(target: number, current: number) {
  const difference = target - current;
  const turns = Math.round(difference / FULL_TURN);
  const wrapped = difference - FULL_TURN * turns;
  return current + wrapped;
}

function followFactorOf(elapsed: number, timeConstant: number) {
  const remaining = Math.exp(-elapsed / timeConstant);
  return 1 - remaining;
}

function rgbOfColor(color: string, probe: CanvasRenderingContext2D): Rgb {
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = '#000';
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [red, green, blue] = probe.getImageData(0, 0, 1, 1).data;
  return [red / 255, green / 255, blue / 255];
}

function mixRgb(from: Rgb, to: Rgb, share: number): Rgb {
  const red = from[0] + (to[0] - from[0]) * share;
  const green = from[1] + (to[1] - from[1]) * share;
  const blue = from[2] + (to[2] - from[2]) * share;
  return [red, green, blue];
}

function luminanceOf([red, green, blue]: Rgb) {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function tokenRgbOf(
  styles: CSSStyleDeclaration,
  token: string,
  probe: CanvasRenderingContext2D
) {
  const value = styles.getPropertyValue(token);
  const color = value.trim();
  return rgbOfColor(color, probe);
}

function createColorProbe() {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.getContext('2d', { willReadFrequently: true });
}

/** Cobe takes colours as RGB triplets from 0 to 1, so the theme tokens are read and converted on every theme change. */
function themeColorsOf(host: HTMLElement): ThemeColors | null {
  const probe = createColorProbe();
  if (!probe) {
    return null;
  }
  const styles = getComputedStyle(host);
  const background = tokenRgbOf(styles, '--background', probe);
  const foreground = tokenRgbOf(styles, '--foreground', probe);
  const card = tokenRgbOf(styles, '--card', probe);
  const primary = tokenRgbOf(styles, '--primary', probe);
  const glowColor = mixRgb(background, foreground, GLOW_SHARE);
  const backgroundLuminance = luminanceOf(background);
  const isDarkTheme = backgroundLuminance < 0.5;
  if (isDarkTheme) {
    return {
      dark: 1,
      baseColor: foreground,
      mapBrightness: MAP_BRIGHTNESS,
      markerColor: primary,
      arcColor: primary,
      glowColor,
    };
  }
  return {
    dark: 0,
    baseColor: card,
    mapBrightness: MAP_BRIGHTNESS,
    markerColor: primary,
    arcColor: primary,
    glowColor,
  };
}

function cobeMarkersOf(markers: GlobeMarker[], markerSize: number) {
  return markers.map((marker) => ({
    location: marker.location,
    size: marker.size ?? markerSize,
  }));
}

function sideOf(host: HTMLElement) {
  const width = host.clientWidth;
  return Math.max(width, 1);
}

function createController(host: HTMLElement, tilt: number): Controller {
  let settings = DEFAULT_SETTINGS;
  let phi = 0;
  let theta = tilt;
  let spin = 0;
  let focusTarget: FocusTarget | null = null;
  let frameId = 0;
  let lastFrameTime = 0;
  let warmUpLeft = WARM_UP_FRAMES;
  let isRevealed = false;
  let isVisible = true;
  let isHeld = false;
  let activePointer: number | null = null;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let lastMoveTime = 0;

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.opacity = '0';
  canvas.style.transition = REVEAL_TRANSITION;
  host.append(canvas);

  const side = sideOf(host);
  const screenRatio = window.devicePixelRatio || 1;
  const pixelRatio = Math.min(screenRatio, MAX_PIXEL_RATIO);
  const colors = themeColorsOf(host);
  const globe = createGlobe(canvas, {
    devicePixelRatio: pixelRatio,
    width: side,
    height: side,
    phi,
    theta,
    mapSamples: 16000,
    mapBrightness: MAP_BRIGHTNESS,
    diffuse: 1.2,
    dark: 0,
    baseColor: [1, 1, 1],
    markerColor: [0.4, 0.4, 0.95],
    glowColor: [1, 1, 1],
    arcWidth: 0.6,
    arcHeight: 0.25,
    markerElevation: 0.02,
    ...colors,
  });

  function isAutoRotating() {
    const isAllowed = settings.autoRotate && !settings.reducedMotion;
    const isUntouched = activePointer === null && !isHeld;
    const isFree = isUntouched && focusTarget === null;
    return isAllowed && isFree;
  }

  function isFocusing() {
    if (!focusTarget) {
      return false;
    }
    return !focusTarget.hasArrived;
  }

  function isSettling() {
    const isSpinning = Math.abs(spin) > MIN_SPIN;
    const isWarmingUp = warmUpLeft > 0;
    return isSpinning || isFocusing() || isWarmingUp;
  }

  function shouldKeepRendering() {
    if (!isVisible) {
      return false;
    }
    return isAutoRotating() || isSettling();
  }

  function arrive(target: FocusTarget) {
    phi = target.phi;
    theta = target.theta;
    target.hasArrived = true;
    if (!target.holds) {
      focusTarget = null;
    }
  }

  function stepFocus(target: FocusTarget, elapsed: number) {
    if (target.hasArrived) {
      return;
    }
    const follow = followFactorOf(elapsed, FOCUS_EASE_MS);
    const phiGap = target.phi - phi;
    const thetaGap = target.theta - theta;
    phi += phiGap * follow;
    theta += thetaGap * follow;
    const phiDistance = Math.abs(phiGap);
    const thetaDistance = Math.abs(thetaGap);
    const hasArrived = phiDistance + thetaDistance < ARRIVED;
    if (hasArrived) {
      arrive(target);
    }
  }

  function aim(target: FocusTarget) {
    focusTarget = target;
    spin = 0;
    if (settings.reducedMotion) {
      arrive(target);
    }
    schedule();
  }

  function step(elapsed: number) {
    if (activePointer !== null) {
      return;
    }
    if (focusTarget) {
      stepFocus(focusTarget, elapsed);
      return;
    }
    const decay = Math.exp(-elapsed / MOMENTUM_DECAY_MS);
    phi += spin * elapsed;
    spin *= decay;
    if (isAutoRotating()) {
      const turnMs = settings.turnDuration * 1000;
      const autoSpeed = FULL_TURN / turnMs;
      phi += autoSpeed * elapsed;
    }
  }

  function reveal() {
    if (isRevealed) {
      return;
    }
    isRevealed = true;
    canvas.style.opacity = '1';
  }

  function render(time: number) {
    frameId = 0;
    const sinceLastFrame = time - lastFrameTime;
    const positiveGap = Math.max(sinceLastFrame, 0);
    const elapsed = Math.min(positiveGap, FRAME_CAP_MS);
    lastFrameTime = time;
    step(elapsed);
    globe.update({ phi, theta });
    if (warmUpLeft > 0) {
      warmUpLeft -= 1;
    }
    if (warmUpLeft === 0) {
      reveal();
    }
    if (shouldKeepRendering()) {
      frameId = requestAnimationFrame(render);
    }
  }

  function schedule() {
    if (frameId) {
      return;
    }
    if (!isVisible) {
      return;
    }
    lastFrameTime = performance.now();
    frameId = requestAnimationFrame(render);
  }

  function applyTheme() {
    const themeColors = themeColorsOf(host);
    if (!themeColors) {
      return;
    }
    globe.update(themeColors);
    schedule();
  }

  function resize() {
    const nextSide = sideOf(host);
    globe.update({ width: nextSide, height: nextSide });
    schedule();
  }

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) {
      schedule();
      return;
    }
    cancelAnimationFrame(frameId);
    frameId = 0;
  });
  visibilityObserver.observe(host);

  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(host);

  const themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme'],
  });

  schedule();

  return {
    configure(next) {
      settings = next;
      globe.update({
        markers: cobeMarkersOf(next.markers, next.markerSize),
        arcs: next.arcs,
      });
      if (next.reducedMotion) {
        spin = 0;
      }
      schedule();
    },
    focus(location) {
      if (!location) {
        focusTarget = null;
        schedule();
        return;
      }
      const angles = anglesOf(location);
      const targetPhi = nearestTurnOf(angles.phi, phi);
      aim({
        phi: targetPhi,
        theta: angles.theta,
        holds: true,
        hasArrived: false,
      });
    },
    nudge(deltaPhi, deltaTheta) {
      const startPhi = focusTarget?.phi ?? phi;
      const startTheta = focusTarget?.theta ?? theta;
      const tiltedTheta = startTheta + deltaTheta;
      aim({
        phi: startPhi + deltaPhi,
        theta: clamp(tiltedTheta, -MAX_TILT, MAX_TILT),
        holds: false,
        hasArrived: false,
      });
    },
    grab(event) {
      if (activePointer !== null) {
        return;
      }
      activePointer = event.pointerId;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      lastMoveTime = event.timeStamp;
      focusTarget = null;
      spin = 0;
      host.setPointerCapture(event.pointerId);
    },
    drag(event) {
      if (event.pointerId !== activePointer) {
        return;
      }
      const width = sideOf(host);
      const deltaX = event.clientX - lastPointerX;
      const deltaY = event.clientY - lastPointerY;
      const sinceLastMove = event.timeStamp - lastMoveTime;
      const elapsed = Math.max(sinceLastMove, 1);
      const deltaPhi = (deltaX / width) * Math.PI;
      const deltaTheta = (deltaY / width) * Math.PI;
      const tiltedTheta = theta + deltaTheta;
      phi += deltaPhi;
      theta = clamp(tiltedTheta, -MAX_TILT, MAX_TILT);
      const rawVelocity = deltaPhi / elapsed;
      const velocity = clamp(rawVelocity, -MAX_SPIN, MAX_SPIN);
      spin = spin * 0.5 + velocity * 0.5;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      lastMoveTime = event.timeStamp;
      globe.update({ phi, theta });
    },
    release(event) {
      if (event.pointerId !== activePointer) {
        return;
      }
      activePointer = null;
      const stillFor = event.timeStamp - lastMoveTime;
      const wasHeldStill = stillFor > RELEASE_STILL_MS;
      if (wasHeldStill || settings.reducedMotion) {
        spin = 0;
      }
      schedule();
    },
    hold(nextHeld) {
      isHeld = nextHeld;
      schedule();
    },
    destroy() {
      cancelAnimationFrame(frameId);
      visibilityObserver.disconnect();
      sizeObserver.disconnect();
      themeObserver.disconnect();
      globe.destroy();
      host.replaceChildren();
    },
  };
}

const KEY_NUDGES: Record<string, [number, number]> = {
  ArrowLeft: [-NUDGE_TURN, 0],
  ArrowRight: [NUDGE_TURN, 0],
  ArrowUp: [0, -NUDGE_TILT],
  ArrowDown: [0, NUDGE_TILT],
};

const NO_MARKERS: GlobeMarker[] = [];

const NO_ARCS: GlobeArc[] = [];

function labelsOf(markers: GlobeMarker[]) {
  const labels = markers.map((marker) => marker.label);
  return labels.filter((label): label is string => Boolean(label));
}

export type GlobeProps = {
  markers?: GlobeMarker[];
  arcs?: GlobeArc[];
  focus?: GlobeLocation | null;
  autoRotate?: boolean;
  turnDuration?: number;
  tilt?: number;
  markerSize?: number;
  label?: string;
  className?: string;
};

export function Globe({
  markers = NO_MARKERS,
  arcs = NO_ARCS,
  focus = null,
  autoRotate = true,
  turnDuration = DEFAULT_TURN_DURATION,
  tilt = 15,
  markerSize = DEFAULT_MARKER_SIZE,
  label = 'Globe',
  className,
}: GlobeProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<Controller | null>(null);
  const startingTiltRef = useRef(tilt);
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion === true;
  const hintId = useId();
  const markerLabels = labelsOf(markers);
  const focusLatitude = focus?.[0];
  const focusLongitude = focus?.[1];

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    const startingTilt = radiansOf(startingTiltRef.current);
    const controller = createController(host, startingTilt);
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.configure({
      markers,
      arcs,
      markerSize,
      autoRotate,
      turnDuration,
      reducedMotion,
    });
  }, [markers, arcs, markerSize, autoRotate, turnDuration, reducedMotion]);

  useEffect(() => {
    const isUnset = focusLatitude === undefined || focusLongitude === undefined;
    if (isUnset) {
      controllerRef.current?.focus(null);
      return;
    }
    controllerRef.current?.focus([focusLatitude, focusLongitude]);
  }, [focusLatitude, focusLongitude]);

  function grab(event: React.PointerEvent<HTMLDivElement>) {
    const isMainButton = event.button === 0;
    if (!isMainButton) {
      return;
    }
    controllerRef.current?.grab(event.nativeEvent);
  }

  function drag(event: React.PointerEvent<HTMLDivElement>) {
    controllerRef.current?.drag(event.nativeEvent);
  }

  function release(event: React.PointerEvent<HTMLDivElement>) {
    controllerRef.current?.release(event.nativeEvent);
  }

  function holdForKeyboard(event: React.FocusEvent<HTMLDivElement>) {
    const isKeyboardFocus = event.currentTarget.matches(':focus-visible');
    controllerRef.current?.hold(isKeyboardFocus);
  }

  function letGo() {
    controllerRef.current?.hold(false);
  }

  function turnWithKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const nudge = KEY_NUDGES[event.key];
    if (!nudge) {
      return;
    }
    event.preventDefault();
    controllerRef.current?.nudge(nudge[0], nudge[1]);
  }

  return (
    <div
      className={cn('relative aspect-square w-full max-w-[600px]', className)}
    >
      <div
        ref={hostRef}
        role='group'
        aria-roledescription='globe'
        aria-label={label}
        aria-describedby={hintId}
        tabIndex={0}
        onPointerDown={grab}
        onPointerMove={drag}
        onPointerUp={release}
        onPointerCancel={release}
        onKeyDown={turnWithKeys}
        onFocus={holdForKeyboard}
        onBlur={letGo}
        className='focus-visible:outline-ring size-full cursor-grab touch-pan-y rounded-full [contain:layout_paint_size] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 active:cursor-grabbing'
      />
      <div id={hintId} className='sr-only'>
        <p>Drag the globe or use the arrow keys to turn it.</p>
        {markerLabels.length > 0 && (
          <ul>
            {markerLabels.map((markerLabel) => (
              <li key={markerLabel}>{markerLabel}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
