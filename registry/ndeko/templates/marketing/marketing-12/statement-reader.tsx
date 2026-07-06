'use client';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { nounOf } from '@/registry/ndeko/lib/words';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { STATEMENT_LINES } from './data';
import { ReaderActions } from './reader-actions';
import { COPY_PRESS_KEY, SESSION } from './reader-session';
import { RowsPanel } from './rows-panel';
import { csvOf, linesReadIn } from './statement';
import { StatementPaper } from './statement-paper';

const COPIED_FOR_MS = 1600;

function announcementOf(readCount: number, total: number, isCopied: boolean) {
  if (isCopied) {
    return 'The rows were copied as CSV';
  }
  const noun = nounOf(readCount, 'row');
  return `${readCount} of ${total} ${noun} read`;
}

export function StatementReader() {
  const { ref, isAutoplaying, state, act, pressed } = useSession(SESSION);
  const { schedule } = useTimeouts();
  const readLines = linesReadIn(STATEMENT_LINES, state.readIds);
  const readCount = readLines.length;
  const total = STATEMENT_LINES.length;
  const announcement = announcementOf(readCount, total, state.isCopied);
  const message = spokenUnless(isAutoplaying, announcement);
  const isCopyPressed = pressed === COPY_PRESS_KEY;
  useKeptHeight(ref);

  function toggleLine(id: string) {
    act({ type: 'lineToggled', id });
  }

  function readAll() {
    act({ type: 'allRead' });
  }

  function clear() {
    act({ type: 'cleared' });
  }

  async function copy() {
    const csv = csvOf(readLines);
    try {
      await navigator.clipboard.writeText(csv);
    } catch {
      return;
    }
    act({ type: 'copied' });
    schedule(() => act({ type: 'copyEnded' }), COPIED_FOR_MS);
  }

  return (
    <div
      ref={ref}
      className='bg-foreground/[0.03] @container/reader min-h-[58rem] rounded-2xl p-2 @3xl/reader:min-h-[29rem] @3xl/reader:p-3'
    >
      <div className='grid grid-cols-1 gap-2 @3xl/reader:grid-cols-[minmax(0,6fr)_minmax(0,7fr)] @3xl/reader:gap-3'>
        <StatementPaper
          readIds={state.readIds}
          headId={state.headId}
          onToggle={toggleLine}
        />
        <RowsPanel readIds={state.readIds} readCount={readCount}>
          <ReaderActions
            readCount={readCount}
            total={total}
            isCopied={state.isCopied}
            isCopyPressed={isCopyPressed}
            onReadAll={readAll}
            onClear={clear}
            onCopy={copy}
          />
        </RowsPanel>
      </div>
      <LiveRegion message={message} />
    </div>
  );
}
