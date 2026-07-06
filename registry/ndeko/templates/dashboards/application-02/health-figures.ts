import {
  HEALTH_META,
  LEADS,
  SPRINTS,
  WORKSTREAMS,
  type Health,
  type Lead,
  type Sprint,
  type SprintId,
} from './data';

export type WorkstreamRow = {
  id: string;
  name: string;
  lead: Lead;
  done: number;
  open: number;
  blocked: number;
  planned: number;
  share: number;
  health: Health;
};

export type Totals = {
  done: number;
  open: number;
  blocked: number;
  planned: number;
  share: number;
};

export type GoalTone = 'good' | 'behind' | 'neutral';

export type Goal = {
  tone: GoalTone;
  done: number;
  planned: number;
  share: number;
  isFinished: boolean;
  /** Where the team should be by today, as a share of the plan. Null once the sprint is over. */
  expectedShare: number | null;
  verdict: string;
  timeLine: string;
};

export function sprintOf(sprintId: SprintId) {
  const sprint = SPRINTS.find((candidate) => candidate.id === sprintId);
  if (sprint) {
    return sprint;
  }
  return SPRINTS[0];
}

function leadOf(leadId: Lead['id']) {
  const lead = LEADS.find((candidate) => candidate.id === leadId);
  if (lead) {
    return lead;
  }
  return LEADS[0];
}

function shareOf(part: number, whole: number) {
  if (whole === 0) {
    return 0;
  }
  return part / whole;
}

function sumOf(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function rowsOf(sprint: Sprint): WorkstreamRow[] {
  return WORKSTREAMS.map((workstream) => {
    const figures = sprint.workstreams.find(
      (candidate) => candidate.workstreamId === workstream.id
    );
    const done = figures?.done ?? 0;
    const open = figures?.open ?? 0;
    const blocked = figures?.blocked ?? 0;
    const health = figures?.health ?? 'on-track';
    const planned = done + open;
    return {
      id: workstream.id,
      name: workstream.name,
      lead: leadOf(workstream.leadId),
      done,
      open,
      blocked,
      planned,
      share: shareOf(done, planned),
      health,
    };
  });
}

export function totalsOf(rows: WorkstreamRow[]): Totals {
  const doneEach = rows.map((row) => row.done);
  const openEach = rows.map((row) => row.open);
  const blockedEach = rows.map((row) => row.blocked);
  const done = sumOf(doneEach);
  const open = sumOf(openEach);
  const blocked = sumOf(blockedEach);
  const planned = done + open;
  const share = shareOf(done, planned);
  return { done, open, blocked, planned, share };
}

function taskCountOf(count: number) {
  if (count === 1) {
    return '1 task';
  }
  return `${count} tasks`;
}

function dayCountOf(count: number) {
  if (count === 1) {
    return '1 working day';
  }
  return `${count} working days`;
}

function paceVerdictOf(gap: number) {
  if (gap === 0) {
    return 'On pace';
  }
  if (gap > 0) {
    const ahead = taskCountOf(gap);
    return `${ahead} ahead of pace`;
  }
  const missing = Math.abs(gap);
  const behind = taskCountOf(missing);
  return `${behind} behind pace`;
}

function paceToneOf(gap: number): GoalTone {
  if (gap < 0) {
    return 'behind';
  }
  return 'good';
}

function finishedToneOf(totals: Totals): GoalTone {
  if (totals.done === totals.planned) {
    return 'good';
  }
  return 'neutral';
}

function finishedVerdictOf(totals: Totals, sprint: Sprint) {
  const moved = totals.planned - totals.done;
  if (moved === 0) {
    return 'Every planned task was done';
  }
  const movedTasks = taskCountOf(moved);
  const nextSprint = sprint.number + 1;
  return `${movedTasks} moved to sprint ${nextSprint}`;
}

export function goalOf(sprint: Sprint, totals: Totals): Goal {
  const isFinished = sprint.daysElapsed >= sprint.workingDays;
  if (isFinished) {
    return {
      tone: finishedToneOf(totals),
      done: totals.done,
      planned: totals.planned,
      share: totals.share,
      isFinished,
      expectedShare: null,
      verdict: finishedVerdictOf(totals, sprint),
      timeLine: sprint.rangeLabel,
    };
  }
  const elapsedShare = shareOf(sprint.daysElapsed, sprint.workingDays);
  const rawExpected = totals.planned * elapsedShare;
  const expected = Math.round(rawExpected);
  const gap = totals.done - expected;
  const daysLeft = sprint.workingDays - sprint.daysElapsed;
  const daysLeftLabel = dayCountOf(daysLeft);
  return {
    tone: paceToneOf(gap),
    done: totals.done,
    planned: totals.planned,
    share: totals.share,
    isFinished,
    expectedShare: shareOf(expected, totals.planned),
    verdict: paceVerdictOf(gap),
    timeLine: `${daysLeftLabel} left, ${expected} expected done by today`,
  };
}

export function needsAttention(row: WorkstreamRow) {
  return row.health !== 'on-track';
}

export function formatShare(share: number) {
  const percent = share * 100;
  const rounded = Math.round(percent);
  return `${rounded}%`;
}

export function percentAmountOf(share: number) {
  const percent = share * 100;
  return Math.round(percent);
}

export function csvRowsOf(rows: WorkstreamRow[]) {
  const header = [
    'Workstream',
    'Lead',
    'Done',
    'Open',
    'Blocked',
    'Progress',
    'Health',
  ];
  const lines = rows.map((row) => [
    row.name,
    row.lead.name,
    String(row.done),
    String(row.open),
    String(row.blocked),
    formatShare(row.share),
    HEALTH_META[row.health].label,
  ]);
  return [header, ...lines];
}
