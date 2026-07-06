'use client';

import { cn } from '@/registry/ndeko/lib/utils';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

import type { PanelTab } from './data';
import { DiffView } from './diff-view';
import { PreviewView } from './preview-view';
import type { PageVersion, TestRun } from './session';
import { TestsView } from './tests-view';

const TABS: PanelTab[] = ['diff', 'tests', 'preview'];

type RunMark = 'none' | 'failing' | 'passing';

const RUN_DOT: Record<RunMark, string> = {
  none: 'hidden',
  failing: 'bg-destructive',
  passing: 'bg-success',
};

const RUN_WORD: Record<RunMark, string> = {
  none: '',
  failing: ', failing',
  passing: ', passing',
};

/** While the second run streams, the tab still says what the first one found. */
function runMarkOf(testRun: TestRun): RunMark {
  if (testRun === 'passed') {
    return 'passing';
  }
  const hasFailed = testRun === 'failed' || testRun === 'passing';
  if (hasFailed) {
    return 'failing';
  }
  return 'none';
}

export type WorkPanelProps = {
  tab: PanelTab;
  hunksStarted: number;
  hunksDone: number;
  testRun: TestRun;
  pageVersion: PageVersion;
  isActive: boolean;
  onTabChange: (tab: PanelTab) => void;
  onPageVersionChange: (version: PageVersion) => void;
  className?: string;
};

export function WorkPanel({
  tab,
  hunksStarted,
  hunksDone,
  testRun,
  pageVersion,
  isActive,
  onTabChange,
  onPageVersionChange,
  className,
}: WorkPanelProps) {
  const runMark = runMarkOf(testRun);
  const hasHunks = hunksStarted > 0;

  function changeTab(next: unknown) {
    const found = TABS.find((candidate) => candidate === next);
    if (found) {
      onTabChange(found);
    }
  }

  return (
    <Tabs
      value={tab}
      onValueChange={changeTab}
      className={cn('min-h-0 gap-3', className)}
    >
      <TabsList
        variant='segmented'
        aria-label='What the agent produced'
        className='shrink-0'
      >
        <TabsTab value='diff'>
          Diff
          {hasHunks && (
            <span className='text-muted-foreground text-xs tabular-nums'>
              {hunksStarted}
              <span className='sr-only'> hunks</span>
            </span>
          )}
        </TabsTab>
        <TabsTab value='tests'>
          Tests
          <span
            className={cn(
              'size-1.5 rounded-full transition-colors duration-500',
              RUN_DOT[runMark]
            )}
          >
            <span className='sr-only'>{RUN_WORD[runMark]}</span>
          </span>
        </TabsTab>
        <TabsTab value='preview'>Preview</TabsTab>
      </TabsList>
      <TabsPanel value='diff' className='flex min-h-0 flex-col'>
        <DiffView
          hunksStarted={hunksStarted}
          hunksDone={hunksDone}
          isActive={isActive}
        />
      </TabsPanel>
      <TabsPanel value='tests' className='flex min-h-0 flex-col'>
        <TestsView testRun={testRun} isActive={isActive} />
      </TabsPanel>
      <TabsPanel value='preview' className='flex min-h-0 flex-col'>
        <PreviewView
          version={pageVersion}
          canCompare={testRun === 'passed'}
          onVersionChange={onPageVersionChange}
        />
      </TabsPanel>
    </Tabs>
  );
}
