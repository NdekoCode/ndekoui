'use client';

import { useState } from 'react';

export type Pose = 'rest' | 'hover' | 'press';

const PRESS_KEYS = [' ', 'Enter'];

function poseOf(isPressed: boolean, isReached: boolean): Pose {
  if (isPressed) {
    return 'press';
  }
  if (isReached) {
    return 'hover';
  }
  return 'rest';
}

function isPressKey(key: string) {
  return PRESS_KEYS.includes(key);
}

/**
 * What a control is being offered. A mouse or a pen on it, or the keyboard on it, is a hover; a
 * press of the pointer or of Space or Enter is a press. A finger never hovers, so a touch only
 * presses. Spread the handlers on an ancestor of the control: the events reach it from inside.
 */
export function usePose<Element extends HTMLElement>() {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const isReached = isHovered || isFocused;
  const pose = poseOf(isPressed, isReached);

  function hoverStarts(event: React.PointerEvent<Element>) {
    if (event.pointerType !== 'touch') {
      setIsHovered(true);
    }
  }

  function hoverEnds() {
    setIsHovered(false);
    setIsPressed(false);
  }

  function pointerPresses() {
    setIsPressed(true);
  }

  function pointerReleases() {
    setIsPressed(false);
  }

  function focusStarts(event: React.FocusEvent<Element>) {
    const isKeyboardFocus = event.target.matches(':focus-visible');
    if (isKeyboardFocus) {
      setIsFocused(true);
    }
  }

  function focusEnds() {
    setIsFocused(false);
    setIsPressed(false);
  }

  function keyPresses(event: React.KeyboardEvent<Element>) {
    if (isPressKey(event.key)) {
      setIsPressed(true);
    }
  }

  function keyReleases(event: React.KeyboardEvent<Element>) {
    if (isPressKey(event.key)) {
      setIsPressed(false);
    }
  }

  const poseHandlers = {
    onPointerEnter: hoverStarts,
    onPointerLeave: hoverEnds,
    onPointerDown: pointerPresses,
    onPointerUp: pointerReleases,
    onPointerCancel: pointerReleases,
    onFocus: focusStarts,
    onBlur: focusEnds,
    onKeyDown: keyPresses,
    onKeyUp: keyReleases,
  };

  return { pose, poseHandlers };
}
