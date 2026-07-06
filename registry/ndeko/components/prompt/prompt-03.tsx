'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  useId,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { WordRoll } from '@/components/core/word-roll';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  hold,
  keyDelayOf,
  prefixesOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import {
  CheckIcon,
  ChevronsUpDownIcon,
  MinusIcon,
  SearchIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { MENU_LABEL } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/registry/ndeko/ui/dialog';
import { Input } from '@/registry/ndeko/ui/input';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';
import { Switch } from '@/registry/ndeko/ui/switch';

import { DrawnCheck } from './_parts/drawn-check';
import { LabTile } from './_parts/lab-tile';
import {
  CAPABILITIES,
  CAPABILITY_LABEL,
  contextLabelOf,
  labOf,
  LABS,
  MODELS,
  modelOf,
  PRICE_WORD,
  SPEED_WORD,
  type Lab,
  type ModelOption,
  type Tier,
} from './_parts/labs';
import { includesQuery, Marked } from './_parts/marked';
import { countOf } from './_parts/words';

/** `inline` draws the panel in the page under its trigger, with no layer to open. */
export type PickerSurface = 'popover' | 'dialog' | 'inline';

export type ModelPickerHandle = {
  /** Moves the highlight by rows, as the arrow keys do. */
  move: (step: number) => void;
  /** Puts the highlight on a model, as the pointer does. */
  highlight: (modelId: string) => void;
  search: (query: string) => void;
  /** Picks the highlighted model, as Enter does. */
  pickHighlighted: () => void;
  compare: (isComparing: boolean) => void;
};

/** Quicker than a tab thumb: the highlight follows the pointer from row to row. */
const HIGHLIGHT_TRAVEL = { type: 'spring', bounce: 0, duration: 0.22 } as const;

const NO_TRAVEL = { duration: 0 };

function highlightTravelOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return NO_TRAVEL;
  }
  return HIGHLIGHT_TRAVEL;
}

const WIDE_QUERY = '(min-width: 640px)';

const TIERS: Tier[] = [1, 2, 3];

const SPEED_BAR_HEIGHT: Record<Tier, string> = {
  1: 'h-1.5',
  2: 'h-2.5',
  3: 'h-3.5',
};

function subscribeToWidth(listener: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

function isWideNow() {
  return window.matchMedia(WIDE_QUERY).matches;
}

function isWideOnServer() {
  return true;
}

function surfaceOf(as: PickerSurface | undefined, isWide: boolean) {
  if (as) {
    return as;
  }
  if (isWide) {
    return 'popover';
  }
  return 'dialog';
}

function barToneOf(isFilled: boolean) {
  if (isFilled) {
    return 'bg-foreground/70';
  }
  return 'bg-foreground/15';
}

function SpeedBars({ speed }: { speed: Tier }) {
  return (
    <span className='inline-flex items-center gap-1'>
      <span aria-hidden='true' className='flex h-3.5 items-end gap-px'>
        {TIERS.map((tier) => (
          <span
            key={tier}
            className={cn(
              'w-[3px] rounded-[1px]',
              SPEED_BAR_HEIGHT[tier],
              barToneOf(tier <= speed)
            )}
          />
        ))}
      </span>
      <span className='sr-only'>{SPEED_WORD[speed]}</span>
    </span>
  );
}

function priceToneOf(isPaid: boolean) {
  if (isPaid) {
    return 'text-foreground/80';
  }
  return 'text-foreground/20';
}

function PriceMarks({ price }: { price: Tier }) {
  return (
    <span className='inline-flex font-mono text-[11px] leading-none'>
      <span aria-hidden='true'>
        {TIERS.map((tier) => (
          <span key={tier} className={priceToneOf(tier <= price)}>
            $
          </span>
        ))}
      </span>
      <span className='sr-only'>{PRICE_WORD[price]}</span>
    </span>
  );
}

function CapabilityChips({ model }: { model: ModelOption }) {
  return (
    <span className='flex flex-wrap gap-1'>
      {model.capabilities.map((capability) => (
        <Badge
          key={capability}
          variant='secondary'
          className='h-[18px] px-1.5 text-[11px] font-normal'
        >
          {CAPABILITY_LABEL[capability]}
        </Badge>
      ))}
    </span>
  );
}

function ModelFacts({ model }: { model: ModelOption }) {
  const context = contextLabelOf(model.contextTokens);

  return (
    <span className='text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs'>
      <span className='tabular-nums'>
        {context}
        <span className='sr-only'> tokens of context</span>
      </span>
      <SpeedBars speed={model.speed} />
      <PriceMarks price={model.price} />
    </span>
  );
}

function matchesModel(model: ModelOption, query: string) {
  const lab = labOf(model.lab);
  const capabilityWords = model.capabilities.map(
    (capability) => CAPABILITY_LABEL[capability]
  );
  const words = [model.name, lab.name, ...capabilityWords];
  const text = words.join(' ');
  return includesQuery(text, query);
}

type ModelGroup = {
  lab: Lab;
  models: ModelOption[];
};

function groupsOf(models: ModelOption[]) {
  const groups: ModelGroup[] = [];
  for (const lab of LABS) {
    const fromLab = models.filter((model) => model.lab === lab.id);
    if (fromLab.length > 0) {
      groups.push({ lab, models: fromLab });
    }
  }
  return groups;
}

function flatOf(groups: ModelGroup[]) {
  const flat: ModelOption[] = [];
  for (const group of groups) {
    flat.push(...group.models);
  }
  return flat;
}

function stepIndex(current: number, step: number, count: number) {
  const moved = current + step;
  const wrapped = moved + count;
  return wrapped % count;
}

/** Scrolls the list itself: scrollIntoView could move the whole page. */
function keepInView(list: HTMLElement | null, optionId: string) {
  if (!list) {
    return;
  }
  const option = document.getElementById(optionId);
  if (!option) {
    return;
  }
  const top = option.offsetTop;
  const bottom = top + option.offsetHeight;
  const viewBottom = list.scrollTop + list.clientHeight;
  if (top < list.scrollTop) {
    list.scrollTop = top;
    return;
  }
  if (bottom > viewBottom) {
    list.scrollTop = bottom - list.clientHeight;
  }
}

function compareOtherOf(
  active: ModelOption | undefined,
  picked: ModelOption,
  visible: ModelOption[]
) {
  const isOther = active !== undefined && active.id !== picked.id;
  if (isOther) {
    return active;
  }
  return visible.find((model) => model.id !== picked.id);
}

function HasMark({ has, label }: { has: boolean; label: string }) {
  if (has) {
    return (
      <span className='text-success-foreground inline-flex'>
        <CheckIcon className='size-3.5' strokeWidth={2.25} />
        <span className='sr-only'>{label}: yes</span>
      </span>
    );
  }
  return (
    <span className='text-muted-foreground/50 inline-flex'>
      <MinusIcon className='size-3.5' />
      <span className='sr-only'>{label}: no</span>
    </span>
  );
}

type CompareTableProps = {
  picked: ModelOption;
  other: ModelOption | undefined;
};

export function CompareTable({ picked, other }: CompareTableProps) {
  const columns = [picked];
  if (other) {
    columns.push(other);
  }

  return (
    <table className='w-full table-fixed text-xs'>
      <caption className='sr-only'>
        Compare {picked.name} with {other?.name ?? 'another model'}
      </caption>
      <thead>
        <tr>
          <th scope='col' className='w-24 pb-2 text-start font-normal'>
            <span className='sr-only'>Fact</span>
          </th>
          {columns.map((model, index) => (
            <th
              key={index}
              scope='col'
              className='pb-2 text-start align-bottom font-medium'
            >
              <span className='text-muted-foreground block text-[11px] font-normal'>
                {index === 0 && 'Current'}
                {index === 1 && 'Looking at'}
              </span>
              <span className='flex items-center gap-1.5'>
                <LabTile lab={model.lab} size='sm' />
                <span className='truncate'>
                  <Swap swapKey={model.id}>{model.name}</Swap>
                </span>
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className='text-muted-foreground'>
        <tr className='h-7'>
          <th scope='row' className='text-start font-normal'>
            Context
          </th>
          {columns.map((model, index) => (
            <td key={index} className='text-foreground tabular-nums'>
              {contextLabelOf(model.contextTokens)}
            </td>
          ))}
        </tr>
        <tr className='h-7'>
          <th scope='row' className='text-start font-normal'>
            Speed
          </th>
          {columns.map((model, index) => (
            <td key={index}>
              <SpeedBars speed={model.speed} />
            </td>
          ))}
        </tr>
        <tr className='h-7'>
          <th scope='row' className='text-start font-normal'>
            Price
          </th>
          {columns.map((model, index) => (
            <td key={index}>
              <PriceMarks price={model.price} />
            </td>
          ))}
        </tr>
        {CAPABILITIES.map((capability) => (
          <tr key={capability} className='h-7'>
            <th scope='row' className='text-start font-normal'>
              {CAPABILITY_LABEL[capability]}
            </th>
            {columns.map((model, index) => (
              <td key={index}>
                <HasMark
                  has={model.capabilities.includes(capability)}
                  label={CAPABILITY_LABEL[capability]}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function resultsLineOf(count: number, query: string) {
  const trimmed = query.trim();
  if (trimmed === '') {
    return '';
  }
  if (count === 0) {
    return `No model matches “${trimmed}”`;
  }
  return countOf(count, 'model');
}

function panelWidthOf(isComparing: boolean, layout: PickerSurface) {
  const isSide = layout === 'popover';
  if (!isSide) {
    return 'w-full';
  }
  if (isComparing) {
    return 'w-[40rem] max-w-[calc(100vw-2rem)]';
  }
  return 'w-[22rem] max-w-[calc(100vw-2rem)]';
}

type ModelPanelProps = {
  models: ModelOption[];
  pickedId: string;
  onPick: (modelId: string) => void;
  layout: PickerSurface;
  searchRef: React.RefObject<HTMLInputElement | null>;
  handleRef?: React.Ref<ModelPickerHandle>;
  isDemonstrated: boolean;
};

function ModelPanel({
  models,
  pickedId,
  onPick,
  layout,
  searchRef,
  handleRef,
  isDemonstrated,
}: ModelPanelProps) {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(pickedId);
  const [isComparing, setIsComparing] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const listId = `${baseId}-list`;
  const picked = modelOf(pickedId);
  const matching = models.filter((model) => matchesModel(model, query));
  const groups = groupsOf(matching);
  const visible = flatOf(groups);
  const active = visible.find((model) => model.id === activeId) ?? visible[0];
  const activeOptionId = optionIdOf(baseId, active?.id);
  const other = compareOtherOf(active, picked, visible);
  const isEmpty = visible.length === 0;
  const results = resultsLineOf(visible.length, query);
  const isSide = layout === 'popover';
  const hasCloseButton = layout === 'dialog';

  function pickHighlighted() {
    if (active) {
      onPick(active.id);
    }
  }

  function optionIdFor(modelId: string) {
    return optionIdOf(baseId, modelId) ?? '';
  }

  function moveActive(step: number) {
    if (isEmpty) {
      return;
    }
    const currentIndex = visible.findIndex((model) => model.id === active?.id);
    const nextIndex = stepIndex(currentIndex, step, visible.length);
    const next = visible[nextIndex];
    setActiveId(next.id);
    keepInView(listRef.current, optionIdFor(next.id));
  }

  function handleSearchKeys(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      pickHighlighted();
    }
  }

  function changeQuery(next: string) {
    setQuery(next);
    listRef.current?.scrollTo({ top: 0 });
  }

  function clearSearch() {
    setQuery('');
    searchRef.current?.focus();
  }

  useImperativeHandle(handleRef, () => ({
    move: moveActive,
    highlight: setActiveId,
    search: changeQuery,
    pickHighlighted,
    compare: setIsComparing,
  }));

  return (
    <AnimatedSize axis={sizeAxisOf(layout)}>
      <div className={cn('flex flex-col', panelWidthOf(isComparing, layout))}>
        <div
          className={cn(
            'flex items-center justify-between gap-3 px-3 pt-3 pb-2',
            hasCloseButton && 'pe-12'
          )}
        >
          <p className='text-sm font-medium'>Choose a model</p>
          <label className='text-muted-foreground flex cursor-pointer items-center gap-2 text-xs'>
            Compare
            <Switch
              checked={isComparing}
              onCheckedChange={(checked) => setIsComparing(checked)}
            />
          </label>
        </div>
        <div className='relative px-3 pb-2'>
          <SearchIcon className='text-muted-foreground pointer-events-none absolute start-5.5 top-4 size-4 -translate-y-1/2' />
          <Input
            ref={searchRef}
            role='combobox'
            aria-expanded='true'
            aria-controls={listId}
            aria-activedescendant={activeOptionId}
            aria-autocomplete='list'
            aria-label='Search models'
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            onKeyDown={handleSearchKeys}
            placeholder='Search by name, lab or skill'
            className='ps-8'
          />
        </div>
        <div className={cn('flex min-h-0', !isSide && 'flex-col')}>
          <div className='min-w-0 flex-1'>
            <div
              ref={listRef}
              id={listId}
              role='listbox'
              aria-label='Models'
              className='relative max-h-72 overflow-y-auto px-1.5 pb-1.5'
            >
              {groups.map((group) => (
                <ModelGroupRows
                  key={group.lab.id}
                  group={group}
                  baseId={baseId}
                  pickedId={pickedId}
                  activeId={active?.id}
                  query={query}
                  onActivate={setActiveId}
                  onPick={onPick}
                />
              ))}
              {isEmpty && (
                <div className='flex flex-col items-center gap-2 px-4 py-6 text-center'>
                  <p className='text-muted-foreground text-[13px]'>{results}</p>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={clearSearch}
                  >
                    <XIcon />
                    Clear the search
                  </Button>
                </div>
              )}
            </div>
          </div>
          {isComparing && (
            <div
              className={cn(
                'bg-foreground/[0.025] dark:bg-foreground/[0.04] m-1.5 mt-0 rounded-lg p-3',
                isSide && 'w-[17rem] shrink-0 self-start'
              )}
            >
              <CompareTable picked={picked} other={other} />
            </div>
          )}
        </div>
        <p className='text-muted-foreground px-3 pt-1 pb-3 text-[11px]'>
          Context, speed and price are illustrative
        </p>
      </div>
      <LiveRegion message={spokenUnless(isDemonstrated, results)} />
    </AnimatedSize>
  );
}

/** In a dialog the width belongs to the dialog; only a popover grows sideways for Compare. */
function sizeAxisOf(layout: PickerSurface) {
  if (layout === 'popover') {
    return 'both';
  }
  return 'height';
}

function optionIdOf(baseId: string, modelId: string | undefined) {
  if (!modelId) {
    return undefined;
  }
  return `${baseId}-option-${modelId}`;
}

type ModelGroupRowsProps = {
  group: ModelGroup;
  baseId: string;
  pickedId: string;
  activeId: string | undefined;
  query: string;
  onActivate: (modelId: string) => void;
  onPick: (modelId: string) => void;
};

function ModelGroupRows({
  group,
  baseId,
  pickedId,
  activeId,
  query,
  onActivate,
  onPick,
}: ModelGroupRowsProps) {
  const headingId = `${baseId}-lab-${group.lab.id}`;
  const highlightId = `${baseId}-highlight`;
  const shouldReduceMotion = usePrefersReducedMotion();
  const travel = highlightTravelOf(shouldReduceMotion);

  return (
    <div role='group' aria-labelledby={headingId}>
      <p id={headingId} className={cn(MENU_LABEL, 'flex items-center gap-1.5')}>
        <LabTile lab={group.lab.id} size='sm' />
        {group.lab.name}
      </p>
      {group.models.map((model) => {
        const isPicked = model.id === pickedId;
        const isActive = model.id === activeId;
        return (
          <div
            key={model.id}
            id={optionIdOf(baseId, model.id)}
            role='option'
            aria-selected={isActive}
            onPointerMove={() => onActivate(model.id)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPick(model.id)}
            className='relative flex cursor-default items-start gap-2.5 rounded-md px-2 py-2'
          >
            {isActive && (
              <motion.span
                layoutId={highlightId}
                layoutDependency={activeId}
                transition={travel}
                aria-hidden='true'
                className='bg-foreground/5 absolute inset-0 rounded-md'
              />
            )}
            <span className='relative flex min-w-0 flex-1 flex-col gap-1'>
              <span className='flex items-baseline gap-2'>
                <span className='shrink-0 text-[13px] font-medium'>
                  <Marked text={model.name} query={query} />
                </span>
                <span className='text-muted-foreground min-w-0 truncate text-xs'>
                  {model.hint}
                </span>
              </span>
              <ModelFacts model={model} />
              <CapabilityChips model={model} />
            </span>
            <AnimatePresence initial={false}>
              {isPicked && (
                <DrawnCheck
                  key='mark'
                  label='Current model'
                  className='relative mt-0.5'
                />
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

type PickerTriggerProps = React.ComponentProps<typeof Button> & {
  model: ModelOption;
};

function PickerTrigger({ model, ...props }: PickerTriggerProps) {
  return (
    <Button
      type='button'
      variant='outline'
      aria-label={`Model: ${model.name}, change`}
      className='gap-2 ps-2.5 pe-2'
      {...props}
    >
      <LabTile lab={model.lab} />
      <WordRoll text={model.name} />
      <ChevronsUpDownIcon className='text-muted-foreground size-3.5' />
    </Button>
  );
}

export type ModelPickerProps = {
  models?: ModelOption[];
  value: string;
  onValueChange: (modelId: string) => void;
  /** Left out, the picker is a dialog under 640px and a popover above. */
  as?: PickerSurface;
  /** Runs what the keys of the panel do while it is shown, for a demonstration or a control beside it. */
  handleRef?: React.Ref<ModelPickerHandle>;
  /** A demonstration drives the panel: its result counts are not read aloud. */
  isDemonstrated?: boolean;
};

export function ModelPicker({
  models = MODELS,
  value,
  onValueChange,
  as,
  handleRef,
  isDemonstrated = false,
}: ModelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isInlineOpen, setIsInlineOpen] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const inlinePresence = rowPresenceOf(shouldReduceMotion);
  const isWide = useSyncExternalStore(
    subscribeToWidth,
    isWideNow,
    isWideOnServer
  );
  const surface = surfaceOf(as, isWide);
  const picked = modelOf(value);

  function pick(modelId: string) {
    onValueChange(modelId);
    setIsOpen(false);
  }

  const panel = (
    <ModelPanel
      models={models}
      pickedId={value}
      onPick={pick}
      layout={surface}
      searchRef={searchRef}
      handleRef={handleRef}
      isDemonstrated={isDemonstrated}
    />
  );

  if (surface === 'inline') {
    return (
      <div className='flex flex-col gap-2'>
        <div>
          <PickerTrigger
            model={picked}
            aria-expanded={isInlineOpen}
            aria-controls={panelId}
            onClick={() => setIsInlineOpen((current) => !current)}
          />
        </div>
        <AnimatePresence initial={false}>
          {isInlineOpen && (
            <motion.div
              key='panel'
              id={panelId}
              role='group'
              aria-label='Choose a model'
              className='overflow-hidden'
              {...inlinePresence}
            >
              <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] rounded-lg'>
                {panel}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (surface === 'dialog') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger render={<PickerTrigger model={picked} />} />
        <DialogContent
          initialFocus={searchRef}
          className='max-w-md p-0'
          contentClassName='gap-0'
          animateSize={false}
        >
          <DialogTitle className='sr-only'>Choose a model</DialogTitle>
          {panel}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={<PickerTrigger model={picked} />} />
      <PopoverContent
        initialFocus={searchRef}
        align='start'
        className='w-auto p-0'
      >
        <PopoverTitle className='sr-only'>Choose a model</PopoverTitle>
        {panel}
      </PopoverContent>
    </Popover>
  );
}

type SurfaceChoice = 'auto' | PickerSurface;

const SURFACES: Segment<SurfaceChoice>[] = [
  { value: 'inline', label: 'Inline' },
  { value: 'auto', label: 'Auto' },
  { value: 'popover', label: 'Popover' },
  { value: 'dialog', label: 'Dialog' },
];

const START_MODEL = 'claude-sonnet';

const DEMO_SEARCH = 'gem';

function asOf(choice: SurfaceChoice) {
  if (choice === 'auto') {
    return undefined;
  }
  return choice;
}

function summaryOf(model: ModelOption) {
  const lab = labOf(model.lab);
  const context = contextLabelOf(model.contextTokens);
  return `By ${lab.name}, ${context} context`;
}

export default function Prompt03() {
  const [modelId, setModelId] = useState(START_MODEL);
  const [surface, setSurface] = useState<SurfaceChoice>('inline');
  const picker = useRef<ModelPickerHandle>(null);
  const model = modelOf(modelId);
  const summary = summaryOf(model);

  function resetDemo() {
    setModelId(START_MODEL);
    picker.current?.compare(false);
    picker.current?.search('');
    picker.current?.highlight(START_MODEL);
  }

  const searchTyping = prefixesOf(DEMO_SEARCH).map((typed, index) => ({
    after: keyDelayOf(index, 900, 110),
    run: () => picker.current?.search(typed),
  }));
  const steps: AutoplayStep[] = [
    { after: 1400, run: () => picker.current?.move(1) },
    { after: 520, run: () => picker.current?.move(1) },
    { after: 520, run: () => picker.current?.move(1) },
    ...searchTyping,
    { after: 900, run: () => picker.current?.pickHighlighted() },
    { after: 1300, run: () => picker.current?.search('') },
    { after: 800, run: () => picker.current?.compare(true) },
    { after: 2200, run: () => picker.current?.compare(false) },
    { after: 600, run: hold },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 2400,
    onReset: resetDemo,
  });

  useKeptHeight(ref);

  return (
    <div ref={ref} className='flex w-full max-w-[24rem] flex-col gap-3'>
      <div className='bg-card hairline-ring ring-border flex flex-col gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <div className='flex flex-col gap-1.5'>
          <p className='text-muted-foreground text-xs'>Answers come from</p>
          <div>
            <ModelPicker
              value={modelId}
              onValueChange={setModelId}
              as={asOf(surface)}
              handleRef={picker}
              isDemonstrated={isAutoplaying}
            />
          </div>
        </div>
        <p className='text-muted-foreground text-xs'>
          <WordRoll text={summary} />
        </p>
      </div>
      <div className='flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-1'>
        <p className='text-muted-foreground text-xs'>Opens as</p>
        <Segments
          value={surface}
          segments={SURFACES}
          onValueChange={setSurface}
          label='Opens as'
          className='w-64 max-w-full'
          itemClassName='px-1.5'
        />
      </div>
      <LiveRegion
        message={spokenUnless(isAutoplaying, `${model.name} picked`)}
      />
    </div>
  );
}
