'use client';

import { useSyncExternalStore } from 'react';

import { SITE_URL } from '@/app/mcp/_shared/mcp-config';
import {
  RADII,
  type GeneratorChoice,
  type Radius,
} from '@/lib/theme-generator';
import {
  GENERATOR_FAMILIES,
  type GeneratorFamilyId,
} from '@/lib/theme-neutrals';

const THEMES_PATH = '/themes';

const GENERATOR_ANCHOR = 'generator';

const MAX_HUE = 359;

function hueOf(text: string | null) {
  if (text === null) {
    return null;
  }
  const hue = Number(text);
  const isWhole = Number.isInteger(hue);
  const isInRange = hue >= 0 && hue <= MAX_HUE;
  if (!isWhole || !isInRange) {
    return null;
  }
  return hue;
}

function familyOf(text: string | null): GeneratorFamilyId | null {
  const family = GENERATOR_FAMILIES.find((candidate) => candidate === text);
  return family ?? null;
}

function radiusOf(text: string | null): Radius | null {
  const radius = RADII.find((candidate) => candidate === text);
  return radius ?? null;
}

/** A link only carries a choice when all three parts are valid; anything else is ignored. */
export function choiceFromSearch(search: string): GeneratorChoice | null {
  const params = new URLSearchParams(search);
  const hue = hueOf(params.get('hue'));
  const neutral = familyOf(params.get('neutral'));
  const radius = radiusOf(params.get('radius'));
  const hasHue = hue !== null;
  const hasNeutral = neutral !== null;
  const hasRadius = radius !== null;
  const isComplete = hasHue && hasNeutral && hasRadius;
  if (!isComplete) {
    return null;
  }
  return { hue, neutral, radius };
}

export function shareUrlOf(origin: string, choice: GeneratorChoice) {
  const params = new URLSearchParams({
    hue: String(choice.hue),
    neutral: choice.neutral,
    radius: choice.radius,
  });
  return `${origin}${THEMES_PATH}?${params.toString()}#${GENERATOR_ANCHOR}`;
}

function subscribeToHistory(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

function searchOnClient() {
  return window.location.search;
}

function searchOnServer() {
  return '';
}

/** The query string of the address. Empty on the server and during hydration, so the page renders the same twice. */
export function useAddressSearch() {
  return useSyncExternalStore(
    subscribeToHistory,
    searchOnClient,
    searchOnServer
  );
}

function subscribeToNothing() {
  return () => {};
}

function originOnClient() {
  return window.location.origin;
}

function originOnServer() {
  return SITE_URL;
}

export function useOrigin() {
  return useSyncExternalStore(
    subscribeToNothing,
    originOnClient,
    originOnServer
  );
}
