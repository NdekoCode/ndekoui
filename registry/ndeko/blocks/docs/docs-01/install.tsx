'use client';

import { WordRoll, type WordRollWord } from '@/components/core/word-roll';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { CheckIcon, CopyIcon, InfoIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { CopyButton } from '@/registry/ndeko/ui/copy-button';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import {
  ADDER,
  INIT_ARGS,
  MANAGERS,
  MANUAL_STEPS,
  PACKAGE,
  RUNNER,
  type Manager,
} from './data';
import type { InstallTab } from './session';

const THUMB =
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15';

const CODE_TRAY = 'bg-foreground/[0.04] rounded-lg';

/** The words before the package keep their key while the package manager changes, so only they roll. */
function commandWordsOf(lead: string, rest: string): WordRollWord[] {
  return [
    { key: `lead-${lead}`, text: lead, node: lead },
    { key: 'rest', text: rest, node: rest },
  ];
}

export function initCommandOf(manager: Manager) {
  return `${RUNNER[manager]} ${INIT_ARGS}`;
}

export function addCommandOf(manager: Manager) {
  return `${ADDER[manager]} ${PACKAGE}`;
}

function copyLabelOf(isCopied: boolean) {
  if (isCopied) {
    return 'Copied';
  }
  return 'Copy the command';
}

function managerOf(values: unknown[]) {
  const [value] = values;
  const option = MANAGERS.find((candidate) => candidate.value === value);
  return option?.value;
}

function tabOf(value: unknown): InstallTab | null {
  if (value === 'cli') {
    return 'cli';
  }
  if (value === 'manual') {
    return 'manual';
  }
  return null;
}

export function CodeLine({ code }: { code: string }) {
  return (
    <div className='relative'>
      <pre
        className={cn(
          CODE_TRAY,
          'relative overflow-x-auto py-2.5 ps-3 pe-10 font-mono text-[12.5px] leading-relaxed'
        )}
      >
        <code>{code}</code>
      </pre>
      <CopyButton
        text={code}
        label='Copy the code'
        className='absolute end-1.5 top-1.5'
      />
    </div>
  );
}

type InstallProps = {
  manager: Manager;
  tab: InstallTab;
  isCommandCopied: boolean;
  pressed: string | null;
  onPickManager: (manager: Manager) => void;
  onPickTab: (tab: InstallTab) => void;
  onCopyCommand: () => void;
};

export function Install({
  manager,
  tab,
  isCommandCopied,
  pressed,
  onPickManager,
  onPickTab,
  onCopyCommand,
}: InstallProps) {
  const initWords = commandWordsOf(RUNNER[manager], INIT_ARGS);
  const addWords = commandWordsOf(ADDER[manager], PACKAGE);

  function pickManager(values: unknown[]) {
    const picked = managerOf(values);
    if (picked) {
      onPickManager(picked);
    }
  }

  function pickTab(value: unknown) {
    const picked = tabOf(value);
    if (picked) {
      onPickTab(picked);
    }
  }

  return (
    <Tabs value={tab} onValueChange={pickTab} className='gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <TabsList variant='segmented'>
          <TabsTab
            value='cli'
            className={pressedQuietOf(pressed === 'tab-cli')}
          >
            Command line
          </TabsTab>
          <TabsTab
            value='manual'
            className={pressedQuietOf(pressed === 'tab-manual')}
          >
            By hand
          </TabsTab>
        </TabsList>
        <ToggleGroup
          aria-label='Package manager'
          value={[manager]}
          onValueChange={pickManager}
          travel
          indicatorClassName={THUMB}
          className='bg-foreground/[0.04] rounded-lg p-0.5'
        >
          {MANAGERS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className={cn(
                'h-6 rounded-md px-2.5 font-mono text-xs',
                pressedQuietOf(pressed === `pm-${option.value}`)
              )}
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <TabsPanel value='cli' className='flex flex-col gap-3'>
        <div
          className={cn(
            CODE_TRAY,
            'relative flex items-center gap-2 py-1.5 ps-3 pe-1.5 font-mono text-[13px]'
          )}
        >
          <span aria-hidden='true' className='text-muted-foreground'>
            $
          </span>
          <code className='relative min-w-0 flex-1 overflow-x-auto py-1 whitespace-nowrap'>
            <WordRoll words={initWords} />
          </code>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={copyLabelOf(isCommandCopied)}
            onClick={onCopyCommand}
            className={cn(
              'text-muted-foreground size-7',
              pressedQuietOf(pressed === 'copy-command')
            )}
          >
            <Swap swapKey={String(isCommandCopied)}>
              {isCommandCopied && <CheckIcon className='size-3.5' />}
              {!isCommandCopied && <CopyIcon className='size-3.5' />}
            </Swap>
          </Button>
        </div>
        <p className='bg-info/10 flex items-start gap-3 rounded-xl px-4 py-3 text-[13px] leading-5'>
          <InfoIcon className='text-info-foreground mt-px size-4 shrink-0' />
          <span>
            The command adds the package, writes the provider into your app and
            asks before it changes a file.
          </span>
        </p>
      </TabsPanel>

      <TabsPanel value='manual'>
        <ol className='flex flex-col gap-5'>
          {MANUAL_STEPS.map((step, index) => {
            const isPackageStep = step.id === 'package';
            return (
              <li key={step.id} className='flex gap-3'>
                <span className='keycap-3d text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-medium tabular-nums'>
                  {index + 1}
                </span>
                <div className='flex min-w-0 flex-1 flex-col gap-2'>
                  <p className='pt-0.5 text-[13px] leading-5'>{step.title}</p>
                  {isPackageStep && (
                    <div className='relative'>
                      <div
                        className={cn(
                          CODE_TRAY,
                          'relative overflow-x-auto py-2.5 ps-3 pe-10 font-mono text-[12.5px] whitespace-nowrap'
                        )}
                      >
                        <WordRoll words={addWords} />
                      </div>
                      <CopyButton
                        text={addCommandOf(manager)}
                        label='Copy the command'
                        className='absolute end-1.5 top-1.5'
                      />
                    </div>
                  )}
                  {step.code && <CodeLine code={step.code} />}
                </div>
              </li>
            );
          })}
        </ol>
      </TabsPanel>
    </Tabs>
  );
}
