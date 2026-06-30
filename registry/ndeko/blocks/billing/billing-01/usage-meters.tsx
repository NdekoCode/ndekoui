import { cn } from '@/registry/ndeko/lib/utils';

import {
  fillOf,
  formatMoney,
  formatQuantity,
  overageCostOf,
  overageOf,
  toneOf,
  type MeterTone,
} from './billing-model';
import { METERS, type Meter } from './data';

const FILL_TONE: Record<MeterTone, string> = {
  calm: 'bg-primary',
  near: 'bg-warning',
  over: 'bg-warning',
};

const NOTE_TONE: Record<MeterTone, string> = {
  calm: 'text-muted-foreground',
  near: 'text-warning-foreground',
  over: 'text-warning-foreground',
};

function noteOf(meter: Meter, tone: MeterTone) {
  if (tone === 'over') {
    const overage = overageOf(meter);
    const extra = formatQuantity(overage, meter.decimals);
    if (meter.overagePrice === null) {
      return `${extra} ${meter.unit} over the plan`;
    }
    const overageCost = overageCostOf(meter);
    const cost = formatMoney(overageCost);
    return `${extra} ${meter.unit} over the plan, ${cost} on demand`;
  }
  const left = meter.included - meter.used;
  const leftText = formatQuantity(left, meter.decimals);
  return `${leftText} ${meter.unit} left`;
}

function MeterRow({ meter }: { meter: Meter }) {
  const tone = toneOf(meter);
  const fill = fillOf(meter);
  const used = formatQuantity(meter.used, meter.decimals);
  const included = formatQuantity(meter.included, 0);
  const note = noteOf(meter, tone);
  const valueNow = Math.min(meter.used, meter.included);
  const fillStyle = { transform: `scaleX(${fill})` };

  return (
    <li className='flex flex-col gap-2'>
      <div className='flex items-baseline justify-between gap-3'>
        <span className='text-[13px] font-medium'>{meter.label}</span>
        <span className='text-[13px] tabular-nums'>
          {used}{' '}
          <span className='text-muted-foreground'>
            of {included} {meter.unit}
          </span>
        </span>
      </div>
      <div
        role='meter'
        aria-label={meter.label}
        aria-valuemin={0}
        aria-valuemax={meter.included}
        aria-valuenow={valueNow}
        aria-valuetext={`${used} of ${included} ${meter.unit}`}
        className='bg-foreground/10 h-1.5 overflow-hidden rounded-full'
      >
        <span
          style={fillStyle}
          className={cn(
            'block h-full origin-left rounded-full rtl:origin-right',
            FILL_TONE[tone]
          )}
        />
      </div>
      <p className={cn('text-xs tabular-nums', NOTE_TONE[tone])}>{note}</p>
    </li>
  );
}

export function UsageMeters() {
  return (
    <ul className='flex flex-col gap-5'>
      {METERS.map((meter) => (
        <MeterRow key={meter.id} meter={meter} />
      ))}
    </ul>
  );
}
