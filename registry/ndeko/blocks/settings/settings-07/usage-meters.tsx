import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import {
  METERS,
  NEAR_LIMIT_SHARE,
  type Meter,
  type MeterId,
  type PlanId,
} from './data';
import { SURFACE } from './settings-frame';

type Tone = 'calm' | 'near' | 'over';

const FILL_TONE: Record<Tone, string> = {
  calm: 'bg-primary',
  near: 'bg-warning',
  over: 'bg-warning',
};

const NOTE_TONE: Record<Tone, string> = {
  calm: 'text-muted-foreground',
  near: 'text-warning-foreground',
  over: 'text-warning-foreground',
};

function toneOf(used: number, included: number): Tone {
  const share = used / included;
  if (share > 1) {
    return 'over';
  }
  if (share >= NEAR_LIMIT_SHARE) {
    return 'near';
  }
  return 'calm';
}

function formatOf(decimals: number): Intl.NumberFormatOptions {
  return {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  };
}

function quantityOf(value: number, decimals: number) {
  const options = formatOf(decimals);
  const formatter = new Intl.NumberFormat('en-US', options);
  return formatter.format(value);
}

function noteOf(meter: Meter, used: number, included: number, tone: Tone) {
  if (tone === 'over') {
    const extra = used - included;
    const over = quantityOf(extra, meter.decimals);
    return `${over} ${meter.unit} over the plan`;
  }
  const remaining = included - used;
  const left = quantityOf(remaining, meter.decimals);
  if (tone === 'near') {
    return `Near the limit: ${left} ${meter.unit} left`;
  }
  return `${left} ${meter.unit} left`;
}

/** The bar stops at its end: what goes past the plan is said in words under it. */
function fillStyleOf(used: number, included: number) {
  const ratio = used / included;
  const share = Math.min(ratio, 1);
  return { transform: `scaleX(${share})` };
}

type MeterRowProps = {
  meter: Meter;
  used: number;
  included: number;
};

function MeterRow({ meter, used, included }: MeterRowProps) {
  const tone = toneOf(used, included);
  const note = noteOf(meter, used, included, tone);
  const includedText = quantityOf(included, 0);
  const usedText = quantityOf(used, meter.decimals);
  const valueNow = Math.min(used, included);

  return (
    <li className='flex flex-col gap-2'>
      <p className='flex flex-wrap items-baseline justify-between gap-x-3'>
        <span className='text-[13px] font-medium'>{meter.label}</span>
        <span className='text-[13px] tabular-nums'>
          <MotionNumber value={used} format={formatOf(meter.decimals)} />
          <span className='text-muted-foreground'>
            {` of ${includedText} ${meter.unit}`}
          </span>
        </span>
      </p>
      <div
        role='meter'
        aria-label={meter.label}
        aria-valuemin={0}
        aria-valuemax={included}
        aria-valuenow={valueNow}
        aria-valuetext={`${usedText} of ${includedText} ${meter.unit}`}
        className='bg-foreground/10 h-1.5 overflow-hidden rounded-full'
      >
        <span
          style={fillStyleOf(used, included)}
          className={cn(
            'block h-full origin-left rounded-full transition-[transform,background-color] duration-500 ease-(--ease-out-strong) rtl:origin-right',
            FILL_TONE[tone]
          )}
        />
      </div>
      <p className={cn('flex text-xs tabular-nums', NOTE_TONE[tone])}>
        <Swap swapKey={tone}>{note}</Swap>
      </p>
    </li>
  );
}

type UsageMetersProps = {
  planId: PlanId;
  used: Record<MeterId, number>;
};

/** What the plan includes follows the plan: a change of plan moves every bar. */
export function UsageMeters({ planId, used }: UsageMetersProps) {
  return (
    <ul className={cn(SURFACE, 'flex flex-col gap-5 p-4 @xl:p-5')}>
      {METERS.map((meter) => (
        <MeterRow
          key={meter.id}
          meter={meter}
          used={used[meter.id]}
          included={meter.included[planId]}
        />
      ))}
    </ul>
  );
}
