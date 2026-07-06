'use client';

import { type RefObject, useEffect } from 'react';

import { type Gaze, GLANCES } from './data';

/** How far the eyes travel from the middle, in the units of the drawing: about three pixels on screen. */
const MAX_SHIFT = 2;

/** A pointer this far from the face makes the eyes look as far as they go. */
const FULL_LOOK_PX = 220;

const GLANCE_EVERY_MS = 1900;

const BLINK_GAPS_MS = [3200, 2400, 4200, 2900];

const BLINK_MS = 160;

const BLINK_FRAMES = [
  { transform: 'scaleY(1)' },
  { transform: 'scaleY(0.1)' },
  { transform: 'scaleY(1)' },
];

const CENTRE: Gaze = { x: 0, y: 0 };

function gazeToward(dx: number, dy: number): Gaze {
  const distance = Math.hypot(dx, dy);
  if (distance === 0) {
    return CENTRE;
  }
  const strength = Math.min(1, distance / FULL_LOOK_PX);
  const unitX = dx / distance;
  const unitY = dy / distance;
  return { x: unitX * strength, y: unitY * strength };
}

/**
 * Turns the eyes of the drawing toward the pointer while it is active. With no pointer they
 * glance about on their own, and they blink now and then. The look is written to two custom
 * properties of the drawing, never through state, so a moving pointer renders nothing.
 */
export function useGaze(
  faceRef: RefObject<SVGSVGElement | null>,
  isActive: boolean
) {
  useEffect(() => {
    const face = faceRef.current;
    if (!face || !isActive) {
      return;
    }
    const drawing: SVGSVGElement = face;
    let isFollowing = false;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let glanceIndex = 0;
    let blinkIndex = 0;
    let glanceTimer: ReturnType<typeof setTimeout> | undefined;
    let blinkTimer: ReturnType<typeof setTimeout> | undefined;

    function look(gaze: Gaze) {
      const shiftX = gaze.x * MAX_SHIFT;
      const shiftY = gaze.y * MAX_SHIFT;
      drawing.style.setProperty('--gaze-x', String(shiftX));
      drawing.style.setProperty('--gaze-y', String(shiftY));
    }

    function followPointer() {
      frame = 0;
      const box = drawing.getBoundingClientRect();
      const centreX = box.left + box.width / 2;
      const centreY = box.top + box.height / 2;
      const dx = pointerX - centreX;
      const dy = pointerY - centreY;
      look(gazeToward(dx, dy));
    }

    function onPointerMove(event: PointerEvent) {
      isFollowing = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame === 0) {
        frame = requestAnimationFrame(followPointer);
      }
    }

    function onPointerLeave() {
      isFollowing = false;
      look(CENTRE);
    }

    function glanceAbout() {
      glanceTimer = setTimeout(() => {
        if (!isFollowing) {
          const position = glanceIndex % GLANCES.length;
          look(GLANCES[position]);
          glanceIndex += 1;
        }
        glanceAbout();
      }, GLANCE_EVERY_MS);
    }

    function closeEyes() {
      const eyes = drawing.querySelectorAll('[data-eye]');
      eyes.forEach((eye) => eye.animate(BLINK_FRAMES, { duration: BLINK_MS }));
    }

    function blinkSometimes() {
      const position = blinkIndex % BLINK_GAPS_MS.length;
      const gap = BLINK_GAPS_MS[position];
      blinkIndex += 1;
      blinkTimer = setTimeout(() => {
        closeEyes();
        blinkSometimes();
      }, gap);
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    glanceAbout();
    blinkSometimes();

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener(
        'pointerleave',
        onPointerLeave
      );
      cancelAnimationFrame(frame);
      clearTimeout(glanceTimer);
      clearTimeout(blinkTimer);
      look(CENTRE);
    };
  }, [faceRef, isActive]);
}
