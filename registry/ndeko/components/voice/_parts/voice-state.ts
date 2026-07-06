export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export const VOICE_STATES: readonly VoiceState[] = [
  'idle',
  'listening',
  'thinking',
  'speaking',
];

export const VOICE_STATE_WORD: Record<VoiceState, string> = {
  idle: 'Idle',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
};

export const VOICE_STATE_LABELS = VOICE_STATES.map(
  (state) => VOICE_STATE_WORD[state]
);

export type StateTable = Record<VoiceState, number>;

export function oneHotOf(state: VoiceState): StateTable {
  return {
    idle: Number(state === 'idle'),
    listening: Number(state === 'listening'),
    thinking: Number(state === 'thinking'),
    speaking: Number(state === 'speaking'),
  };
}

export function easeWeights(
  weights: StateTable,
  target: StateTable,
  amount: number
) {
  for (const state of VOICE_STATES) {
    const gap = target[state] - weights[state];
    weights[state] += gap * amount;
  }
}

export function blendOf(values: StateTable, weights: StateTable) {
  let total = 0;
  for (const state of VOICE_STATES) {
    total += values[state] * weights[state];
  }
  return total;
}
