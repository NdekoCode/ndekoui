import type {
  SessionConfig,
  SessionStep,
} from '@/registry/ndeko/hooks/use-session';

import {
  DEFAULT_LIGHT,
  HERO_LOOKS,
  LIGHTS,
  SEED_LOOKS,
  SEED_SEQUENCE,
  type Light,
  type LightId,
  type SceneLook,
} from './data';

export type LightState = {
  light: LightId;
  seedIndex: number;
  isLocked: boolean;
  replay: number;
};

export type LightAction =
  | { type: 'lightPicked'; light: LightId }
  | { type: 'lockToggled' }
  | { type: 'shuffled' }
  | { type: 'reproduced' };

type Step = SessionStep<LightState, LightAction>;

export const LOCK_PRESS_KEY = 'lock';

export const REPRODUCE_PRESS_KEY = 'reproduce';

export const INITIAL: LightState = {
  light: DEFAULT_LIGHT,
  seedIndex: 0,
  isLocked: false,
  replay: 0,
};

export const RESTING: LightState = {
  light: DEFAULT_LIGHT,
  seedIndex: 0,
  isLocked: true,
  replay: 0,
};

function nextSeedIndexOf(seedIndex: number) {
  return (seedIndex + 1) % SEED_SEQUENCE.length;
}

function lightPicked(state: LightState, light: LightId): LightState {
  if (state.isLocked) {
    return { ...state, light };
  }
  return { ...state, light, seedIndex: nextSeedIndexOf(state.seedIndex) };
}

function shuffled(state: LightState): LightState {
  if (state.isLocked) {
    return state;
  }
  return { ...state, seedIndex: nextSeedIndexOf(state.seedIndex) };
}

export function reducer(state: LightState, action: LightAction): LightState {
  switch (action.type) {
    case 'lightPicked':
      return lightPicked(state, action.light);
    case 'lockToggled':
      return { ...state, isLocked: !state.isLocked };
    case 'shuffled':
      return shuffled(state);
    case 'reproduced':
      return { ...state, replay: state.replay + 1 };
  }
}

export function seedOf(state: LightState) {
  return SEED_SEQUENCE[state.seedIndex];
}

export function lightOf(id: LightId): Light {
  const found = LIGHTS.find((candidate) => candidate.id === id);
  return found ?? LIGHTS[0];
}

export function lookOf(state: LightState): SceneLook {
  const light = lightOf(state.light);
  const composition = SEED_LOOKS[state.seedIndex % SEED_LOOKS.length];
  return {
    ...HERO_LOOKS[0],
    ...light.look,
    mugX: composition.mugX,
    mugScale: composition.mugScale,
  };
}

function lightStep(after: number, light: LightId): Step {
  return { after, by: 'demo', action: { type: 'lightPicked', light } };
}

const SCRIPT: Step[] = [
  lightStep(1800, 'golden'),
  lightStep(1800, 'flash'),
  {
    after: 1500,
    by: 'demo',
    press: LOCK_PRESS_KEY,
    action: { type: 'lockToggled' },
  },
  lightStep(1600, 'side'),
  lightStep(1600, 'overcast'),
  {
    after: 1500,
    by: 'demo',
    press: REPRODUCE_PRESS_KEY,
    action: { type: 'reproduced' },
  },
  lightStep(1800, 'window'),
];

export const SESSION: SessionConfig<LightState, LightAction> = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: 2200,
};
