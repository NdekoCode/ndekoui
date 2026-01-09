import { cn } from '@/registry/ndeko/lib/utils';
import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

const MAX_MONTHS = 12;
const LABEL_EVERY = 2;

const TICKS = Array.from({ length: MAX_MONTHS + 1 }, (_, index) => index);

function isLabelledTick(tick: number) {
  const remainder = tick % LABEL_EVERY;
  return remainder === 0;
}

export default function Slider07() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label>Retention in months</Label>
      <div className='flex flex-col gap-1.5'>
        <Slider
          defaultValue={5}
          max={MAX_MONTHS}
          thumbLabels={['Retention in months']}
        />
        <span
          className='text-muted-foreground flex w-full items-start justify-between text-xs font-medium tabular-nums'
          aria-hidden='true'
        >
          {TICKS.map((tick) => {
            const isLabelled = isLabelledTick(tick);
            return (
              <span
                key={tick}
                className='flex w-0 flex-col items-center gap-1.5'
              >
                <span
                  className={cn(
                    'bg-muted-foreground/60 h-1 w-px',
                    !isLabelled && 'h-0.5'
                  )}
                />
                {isLabelled && <span>{tick}</span>}
              </span>
            );
          })}
        </span>
      </div>
    </div>
  );
}
