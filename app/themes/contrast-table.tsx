import {
  CONTRAST_PAIRS,
  ratioText,
  type ContrastCheck,
  type ContrastPair,
  type ThemeMode,
} from '@/lib/theme-colours';
import { CheckIcon, CircleAlertIcon } from '@/registry/ndeko/lib/icons';

const CORE_PAIR_IDS = ['ink-page', 'ink-card', 'fill-text', 'ring-page'];

const CORE_PAIRS = CONTRAST_PAIRS.filter((pair) =>
  CORE_PAIR_IDS.includes(pair.id)
);

type ContrastTableProps = {
  checks: readonly ContrastCheck[];
};

function checkFor(
  checks: readonly ContrastCheck[],
  pair: ContrastPair,
  mode: ThemeMode
) {
  return checks.find((check) => check.id === pair.id && check.mode === mode);
}

function Verdict({ check }: { check: ContrastCheck }) {
  if (check.passes) {
    return (
      <>
        <CheckIcon
          aria-hidden='true'
          className='text-success-foreground size-3.5'
        />
        <span className='sr-only'>Passes</span>
      </>
    );
  }
  return (
    <>
      <CircleAlertIcon
        aria-hidden='true'
        className='text-destructive-ink size-3.5'
      />
      <span className='sr-only'>{`Below ${check.required}:1`}</span>
    </>
  );
}

function RatioCell({ check }: { check: ContrastCheck | undefined }) {
  if (!check) {
    return <td className='py-1 ps-3' />;
  }
  return (
    <td className='py-1 ps-3'>
      <span className='flex items-center justify-end gap-1.5 tabular-nums'>
        {ratioText(check.ratio)}
        <Verdict check={check} />
      </span>
    </td>
  );
}

function summaryOf(checks: readonly ContrastCheck[]) {
  const passed = checks.filter((check) => check.passes).length;
  return { passed, total: checks.length };
}

export function ContrastTable({ checks }: ContrastTableProps) {
  const { passed, total } = summaryOf(checks);

  return (
    <div className='bg-foreground/[0.04] flex flex-col gap-2 rounded-lg px-3 py-2.5'>
      <table className='w-full text-[13px]'>
        <caption className='sr-only'>
          Contrast of the colours this theme sets
        </caption>
        <thead>
          <tr className='text-muted-foreground text-xs'>
            <th scope='col' className='py-1 text-start font-normal'>
              Pair
            </th>
            <th scope='col' className='py-1 ps-3 text-end font-normal'>
              Light
            </th>
            <th scope='col' className='py-1 ps-3 text-end font-normal'>
              Dark
            </th>
          </tr>
        </thead>
        <tbody>
          {CORE_PAIRS.map((pair) => (
            <tr key={pair.id}>
              <th scope='row' className='py-1 text-start font-normal'>
                {pair.label}
              </th>
              <RatioCell check={checkFor(checks, pair, 'light')} />
              <RatioCell check={checkFor(checks, pair, 'dark')} />
            </tr>
          ))}
        </tbody>
      </table>
      <p className='text-muted-foreground text-xs text-pretty'>
        {`AA asks 4.5:1 for text and 3:1 for the focus ring. Body, muted and status text on the page and cards are measured too: ${passed} of ${total} pairs pass.`}
      </p>
    </div>
  );
}
