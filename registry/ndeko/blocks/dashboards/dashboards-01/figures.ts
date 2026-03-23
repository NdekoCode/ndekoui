import {
  METRICS,
  PERIODS,
  SERIES,
  type MetricDefinition,
  type MetricId,
  type Period,
  type PeriodId,
} from './data';

const NUMBER_FORMAT = new Intl.NumberFormat('en');

export type MetricFigure = {
  metric: MetricDefinition;
  total: number;
  totalText: string;
  hint: string;
};

export function periodOf(periodId: PeriodId) {
  const period = PERIODS.find((candidate) => candidate.id === periodId);
  if (period) {
    return period;
  }
  return PERIODS[0];
}

export function metricOf(metricId: MetricId) {
  const metric = METRICS.find((candidate) => candidate.id === metricId);
  if (metric) {
    return metric;
  }
  return METRICS[0];
}

function sumOf(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function totalOf(metric: MetricDefinition, values: number[]) {
  const sum = sumOf(values);
  if (metric.aggregate === 'sum') {
    return sum;
  }
  const average = sum / values.length;
  return Math.round(average);
}

export function formatMetric(metric: MetricDefinition, value: number) {
  const digits = NUMBER_FORMAT.format(value);
  return `${digits}${metric.suffix}`;
}

function aggregateLineOf(metric: MetricDefinition, period: Period) {
  const count = period.points.length;
  if (metric.aggregate === 'sum') {
    return `Sum of ${count} ${period.unitPlural}`;
  }
  return `Average of ${count} ${period.unitPlural}`;
}

function percentChangeOf(total: number, previousTotal: number) {
  const difference = total - previousTotal;
  const ratio = difference / previousTotal;
  const percent = ratio * 100;
  return Math.round(percent);
}

function percentLineOf(percent: number, previous: string) {
  if (percent === 0) {
    return `same as ${previous}`;
  }
  if (percent > 0) {
    return `up ${percent}% on ${previous}`;
  }
  const drop = Math.abs(percent);
  return `down ${drop}% on ${previous}`;
}

function pointsWordOf(points: number) {
  if (points === 1) {
    return 'point';
  }
  return 'points';
}

function pointsLineOf(difference: number, previous: string) {
  if (difference === 0) {
    return `same as ${previous}`;
  }
  const points = Math.abs(difference);
  const word = pointsWordOf(points);
  if (difference > 0) {
    return `up ${points} ${word} on ${previous}`;
  }
  return `down ${points} ${word} on ${previous}`;
}

function reviewLineOf(difference: number, previous: string) {
  if (difference === 0) {
    return `as fast as ${previous}`;
  }
  const hours = Math.abs(difference);
  if (difference < 0) {
    return `${hours}h faster than ${previous}`;
  }
  return `${hours}h slower than ${previous}`;
}

function changeLineOf(
  metric: MetricDefinition,
  total: number,
  previousTotal: number,
  period: Period
) {
  const count = period.points.length;
  const previous = `the previous ${count}`;
  if (metric.change === 'percent') {
    const percent = percentChangeOf(total, previousTotal);
    return percentLineOf(percent, previous);
  }
  const difference = total - previousTotal;
  if (metric.change === 'points') {
    return pointsLineOf(difference, previous);
  }
  return reviewLineOf(difference, previous);
}

export function figuresOf(periodId: PeriodId): MetricFigure[] {
  const period = periodOf(periodId);
  return METRICS.map((metric) => {
    const series = SERIES[periodId][metric.id];
    const total = totalOf(metric, series.values);
    const totalText = formatMetric(metric, total);
    const aggregateLine = aggregateLineOf(metric, period);
    const changeLine = changeLineOf(
      metric,
      total,
      series.previousTotal,
      period
    );
    return {
      metric,
      total,
      totalText,
      hint: `${aggregateLine}, ${changeLine}`,
    };
  });
}

export function chartPointsOf(periodId: PeriodId, metricId: MetricId) {
  const period = periodOf(periodId);
  const series = SERIES[periodId][metricId];
  return period.points.map((point, index) => ({
    axisLabel: point.axisLabel,
    label: point.label,
    value: series.values[index],
  }));
}

export function csvRowsOf(periodId: PeriodId) {
  const period = periodOf(periodId);
  const headings = METRICS.map((metric) => metric.csvHeading);
  const header = ['Period', ...headings];
  const rows = period.points.map((point, index) => {
    const cells = METRICS.map((metric) => {
      const value = SERIES[periodId][metric.id].values[index];
      return String(value);
    });
    return [point.label, ...cells];
  });
  return [header, ...rows];
}
