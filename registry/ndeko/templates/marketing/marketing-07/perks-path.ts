import { DEFAULT_SPEND, SPEND_RANGE } from './data';

export type SpendStep = {
  after: number;
  value: number;
};

const WAYPOINTS = [2400, 300, 1200, DEFAULT_SPEND];

const HOLD_MS = 900;

const TICK_MS = 60;

function delayOf(isFirstOfLeg: boolean) {
  if (isFirstOfLeg) {
    return HOLD_MS;
  }
  return TICK_MS;
}

function pathOf(start: number, waypoints: number[]) {
  const steps: SpendStep[] = [];
  let current = start;
  for (const target of waypoints) {
    const direction = Math.sign(target - current);
    let isFirstOfLeg = true;
    while (current !== target) {
      current += direction * SPEND_RANGE.step;
      steps.push({ after: delayOf(isFirstOfLeg), value: current });
      isFirstOfLeg = false;
    }
  }
  return steps;
}

export const SPEND_PATH = pathOf(DEFAULT_SPEND, WAYPOINTS);
