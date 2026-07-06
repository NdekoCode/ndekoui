import { BUDGET_RANGE, DEFAULT_BUDGET } from './data';

export type BudgetStep = {
  after: number;
  value: number;
};

const WAYPOINTS = [150000, 30000, 190000, DEFAULT_BUDGET];

const HOLD_MS = 1000;

const TICK_MS = 70;

function delayOf(isFirstOfLeg: boolean) {
  if (isFirstOfLeg) {
    return HOLD_MS;
  }
  return TICK_MS;
}

function pathOf(start: number, waypoints: number[]) {
  const steps: BudgetStep[] = [];
  let current = start;
  for (const target of waypoints) {
    const direction = Math.sign(target - current);
    let isFirstOfLeg = true;
    while (current !== target) {
      current += direction * BUDGET_RANGE.step;
      steps.push({ after: delayOf(isFirstOfLeg), value: current });
      isFirstOfLeg = false;
    }
  }
  return steps;
}

export const BUDGET_PATH = pathOf(DEFAULT_BUDGET, WAYPOINTS);
