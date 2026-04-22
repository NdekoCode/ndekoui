import {
  MEMBERS,
  MEMBER_WEEKS,
  PROJECTS,
  WEEKS,
  type Member,
  type MemberId,
  type ProjectId,
  type Week,
  type WeekId,
} from './data';

export type Scope = 'everyone' | MemberId;

export type WeekQuery = { weekId: WeekId; scope: Scope };

export type DayBar = {
  axisLabel: string;
  label: string;
  minutes: number;
  isToday: boolean;
  isAhead: boolean;
};

export type RankedProject = {
  id: ProjectId;
  name: string;
  minutes: number;
  share: number;
};

export type OtherProjects = {
  count: number;
  minutes: number;
  share: number;
};

const RANKED_ROWS = 4;

const WORKING_DAYS = 5;

export function weekOf(weekId: WeekId) {
  const week = WEEKS.find((candidate) => candidate.id === weekId);
  if (week) {
    return week;
  }
  return WEEKS[0];
}

export function memberOf(scope: Scope): Member | null {
  const member = MEMBERS.find((candidate) => candidate.id === scope);
  if (member) {
    return member;
  }
  return null;
}

function membersIn(scope: Scope): MemberId[] {
  if (scope === 'everyone') {
    return MEMBERS.map((member) => member.id);
  }
  return [scope];
}

function sumOf(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function isAheadOf(week: Week, index: number) {
  if (week.todayIndex === null) {
    return false;
  }
  return index > week.todayIndex;
}

export function dayBarsOf(query: WeekQuery): DayBar[] {
  const week = weekOf(query.weekId);
  const memberIds = membersIn(query.scope);
  return week.days.map((day, index) => {
    const dayMinutes = memberIds.map(
      (memberId) => MEMBER_WEEKS[memberId][query.weekId].days[index]
    );
    const minutes = sumOf(dayMinutes);
    const isToday = week.todayIndex === index;
    const isAhead = isAheadOf(week, index);
    return {
      axisLabel: `${day.short} ${day.date}`,
      label: `${day.name} ${day.date} ${day.month}`,
      minutes,
      isToday,
      isAhead,
    };
  });
}

export function totalMinutesOf(bars: DayBar[]) {
  const minutes = bars.map((bar) => bar.minutes);
  return sumOf(minutes);
}

/** Monday to Friday, counted up to today while the week is running. */
export function workingDaysSoFarOf(week: Week) {
  if (week.todayIndex === null) {
    return WORKING_DAYS;
  }
  const daysSoFar = week.todayIndex + 1;
  return Math.min(daysSoFar, WORKING_DAYS);
}

/** Weekend time stays in the total but not in the average of a working day. */
export function averageWorkdayMinutesOf(bars: DayBar[], week: Week) {
  const workingDays = workingDaysSoFarOf(week);
  const weekdayBars = bars.slice(0, WORKING_DAYS);
  const weekdayMinutes = totalMinutesOf(weekdayBars);
  const average = weekdayMinutes / workingDays;
  return Math.round(average);
}

function addMinutes(
  totals: Map<ProjectId, number>,
  projectId: ProjectId,
  minutes: number
) {
  const current = totals.get(projectId) ?? 0;
  const next = current + minutes;
  totals.set(projectId, next);
}

function addMemberWeek(
  totals: Map<ProjectId, number>,
  memberId: MemberId,
  weekId: WeekId
) {
  const memberWeek = MEMBER_WEEKS[memberId][weekId];
  const weekTotal = sumOf(memberWeek.days);
  const lastMixIndex = memberWeek.mix.length - 1;
  let allocated = 0;
  memberWeek.mix.forEach((entry, index) => {
    const isLast = index === lastMixIndex;
    if (isLast) {
      const remainder = weekTotal - allocated;
      addMinutes(totals, entry.projectId, remainder);
      return;
    }
    const rawMinutes = weekTotal * entry.share;
    const minutes = Math.round(rawMinutes);
    allocated += minutes;
    addMinutes(totals, entry.projectId, minutes);
  });
}

function projectNameOf(projectId: ProjectId) {
  const project = PROJECTS.find((candidate) => candidate.id === projectId);
  if (project) {
    return project.name;
  }
  return projectId;
}

function shareOf(minutes: number, totalMinutes: number) {
  if (totalMinutes === 0) {
    return 0;
  }
  return minutes / totalMinutes;
}

function byMinutesThenName(first: RankedProject, second: RankedProject) {
  const difference = second.minutes - first.minutes;
  if (difference !== 0) {
    return difference;
  }
  return first.name.localeCompare(second.name);
}

export function rankingOf(query: WeekQuery) {
  const totals = new Map<ProjectId, number>();
  const memberIds = membersIn(query.scope);
  memberIds.forEach((memberId) =>
    addMemberWeek(totals, memberId, query.weekId)
  );
  const allMinutes = Array.from(totals.values());
  const totalMinutes = sumOf(allMinutes);
  const entries = Array.from(totals.entries());
  const projects = entries.map(([projectId, minutes]) => ({
    id: projectId,
    name: projectNameOf(projectId),
    minutes,
    share: shareOf(minutes, totalMinutes),
  }));
  const sorted = [...projects].sort(byMinutesThenName);
  const rows = sorted.slice(0, RANKED_ROWS);
  const rest = sorted.slice(RANKED_ROWS);
  const restEach = rest.map((project) => project.minutes);
  const restMinutes = sumOf(restEach);
  const other = otherOf(rest.length, restMinutes, totalMinutes);
  return { rows, other, projectCount: sorted.length };
}

function otherOf(
  count: number,
  minutes: number,
  totalMinutes: number
): OtherProjects | null {
  if (count === 0) {
    return null;
  }
  const share = shareOf(minutes, totalMinutes);
  return { count, minutes, share };
}

export function formatDuration(minutes: number) {
  const rawHours = minutes / 60;
  const hours = Math.floor(rawHours);
  const rest = minutes % 60;
  const paddedRest = String(rest).padStart(2, '0');
  return `${hours}h ${paddedRest}m`;
}

export function formatShare(share: number) {
  const percent = share * 100;
  const rounded = Math.round(percent);
  return `${rounded}%`;
}

export function csvRowsOf(bars: DayBar[]) {
  const header = ['Day', 'Tracked time', 'Minutes'];
  const rows = bars.map((bar) => {
    const duration = formatDuration(bar.minutes);
    const minutes = String(bar.minutes);
    return [bar.label, duration, minutes];
  });
  return [header, ...rows];
}
