import {
  CircleCheckIcon,
  FileTextIcon,
  TriangleAlertIcon,
} from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';

import {
  STATEMENT_LINES,
  STEP_EXPORT,
  STEP_FILE,
  STEP_FLAGGED_ROW,
  type StepId,
} from './data';
import { signedAmountOf } from './statement';

const FRAME =
  'bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col gap-2 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

function DropVisual() {
  return (
    <div className={FRAME}>
      <div className='flex items-center gap-2.5'>
        <span className='keycap-3d text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
          <FileTextIcon className='size-4' />
        </span>
        <div className='flex min-w-0 flex-col'>
          <p className='truncate text-[13px] font-medium'>{STEP_FILE.name}</p>
          <p className='text-muted-foreground text-xs'>{STEP_FILE.detail}</p>
        </div>
      </div>
      <div className='bg-foreground/[0.06] h-1.5 overflow-hidden rounded-full'>
        <div className='bg-primary h-full w-full origin-left rounded-full' />
      </div>
    </div>
  );
}

function CheckVisual() {
  const rows = STATEMENT_LINES.slice(2, 5);

  return (
    <div className={FRAME}>
      {rows.map((line) => {
        const isFlagged = line.description === STEP_FLAGGED_ROW.description;
        return (
          <div key={line.id} className='flex h-7 items-center gap-2 text-xs'>
            <span className='min-w-0 flex-1 truncate'>{line.description}</span>
            <span className='text-muted-foreground shrink-0 tabular-nums'>
              {signedAmountOf(line.amountCents)}
            </span>
            {isFlagged && (
              <Badge variant='warning'>
                <TriangleAlertIcon />
                Check
              </Badge>
            )}
          </div>
        );
      })}
      <p className='text-muted-foreground text-xs'>{STEP_FLAGGED_ROW.reason}</p>
    </div>
  );
}

function ExportVisual() {
  const ExportIcon = STEP_EXPORT.icon;
  const rowCount = STATEMENT_LINES.length;

  return (
    <div className={FRAME}>
      <div className='flex items-center gap-2.5'>
        <span className='keycap-3d text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
          <ExportIcon className='size-4' />
        </span>
        <div className='flex min-w-0 flex-col'>
          <p className='truncate text-[13px] font-medium'>{STEP_EXPORT.name}</p>
          <p className='text-muted-foreground text-xs tabular-nums'>
            {rowCount} rows
          </p>
        </div>
        <Badge variant='success' className='ms-auto'>
          <CircleCheckIcon />
          Ready
        </Badge>
      </div>
    </div>
  );
}

const VISUALS: Record<StepId, React.ReactNode> = {
  drop: <DropVisual />,
  check: <CheckVisual />,
  export: <ExportVisual />,
};

export function StepVisual({ id }: { id: StepId }) {
  return <div aria-hidden='true'>{VISUALS[id]}</div>;
}
