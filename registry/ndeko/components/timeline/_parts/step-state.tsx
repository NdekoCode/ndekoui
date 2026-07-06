type StepState = 'done' | 'current' | 'ahead';

const STATE_WORD: Record<StepState, string> = {
  done: 'done',
  current: 'in progress',
  ahead: 'to come',
};

export function stepStateOf(step: number, doneCount: number): StepState {
  if (step <= doneCount) {
    return 'done';
  }
  if (step === doneCount + 1) {
    return 'current';
  }
  return 'ahead';
}

export function currentStepOf(state: StepState) {
  if (state === 'current') {
    return 'step' as const;
  }
  return undefined;
}

type StepStateNoteProps = {
  state: StepState;
};

/* The colour of the marker says where a step stands: this says it in words for a screen reader. */
export function StepStateNote({ state }: StepStateNoteProps) {
  return <span className='sr-only'>, {STATE_WORD[state]}</span>;
}
