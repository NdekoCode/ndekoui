import {
  BASE_COUNT,
  DEMO_NAMES,
  INITIAL_NAMES,
  KEPT_COUNT,
  type Member,
} from './data';

export type Stack = {
  /** Newest first. */
  members: Member[];
  count: number;
  nextDemo: number;
};

const INITIAL_MEMBERS: Member[] = INITIAL_NAMES.map((name, index) => ({
  id: index,
  name,
}));

export const INITIAL_STACK: Stack = {
  members: INITIAL_MEMBERS,
  count: BASE_COUNT,
  nextDemo: 0,
};

export function withJoin(stack: Stack, name: string): Stack {
  const count = stack.count + 1;
  const member: Member = { id: count, name };
  const members = [member, ...stack.members].slice(0, KEPT_COUNT);
  return { ...stack, members, count };
}

export function withDemoJoin(stack: Stack): Stack {
  const position = stack.nextDemo % DEMO_NAMES.length;
  const name = DEMO_NAMES[position];
  const joined = withJoin(stack, name);
  return { ...joined, nextDemo: stack.nextDemo + 1 };
}
