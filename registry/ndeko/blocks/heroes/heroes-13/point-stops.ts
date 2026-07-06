import type { StopSpec } from './point-field';

export const POINT_STOPS: readonly StopSpec[] = [
  {
    anchorId: 'hero',
    at: 0.5,
    shape: 'sphere',
    centreX: 0.5,
    centreY: 0.5,
    follow: 0.45,
    size: 0.46,
  },
  {
    anchorId: 'chat',
    at: 0,
    shape: 'sphere',
    centreX: 0.14,
    centreY: 0.5,
    follow: 0.6,
    size: 0.24,
  },
  {
    anchorId: 'chat',
    at: 0.55,
    shape: 'ring',
    centreX: 0.5,
    centreY: 0.5,
    follow: 1,
    size: 0.3,
    wrapsId: 'chat-card',
  },
  {
    anchorId: 'abilities',
    at: 0.25,
    until: 0.85,
    shape: 'wave',
    centreX: 0.5,
    centreY: 0.76,
    follow: 0,
    size: 0.3,
  },
];
