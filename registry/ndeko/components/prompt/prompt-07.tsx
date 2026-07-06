'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useImperativeHandle, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  hold,
  keyDelayOf,
  prefixesOf,
  PRESS_LEAD_MS,
  pressedSolidOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { FileTextIcon, SearchIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { CopyButton } from '@/registry/ndeko/ui/copy-button';
import { Input } from '@/registry/ndeko/ui/input';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

import { includesQuery, Marked } from './_parts/marked';
import { countOf } from './_parts/words';

export type TemplateField =
  | { kind: 'text'; id: string; label: string }
  | { kind: 'choice'; id: string; label: string; options: string[] }
  | {
      kind: 'optional';
      id: string;
      label: string;
      /** Words around the field that leave the prompt with it while it is empty. */
      before: string;
      after: string;
    };

export type TemplatePart =
  { kind: 'text'; text: string } | { kind: 'field'; field: TemplateField };

export type PromptTemplate = {
  id: string;
  title: string;
  parts: TemplatePart[];
};

export type TemplateValues = Record<string, string>;

function text(value: string): TemplatePart {
  return { kind: 'text', text: value };
}

function blank(id: string, label: string): TemplatePart {
  return { kind: 'field', field: { kind: 'text', id, label } };
}

function oneOf(id: string, label: string, options: string[]): TemplatePart {
  return { kind: 'field', field: { kind: 'choice', id, label, options } };
}

function maybe(
  id: string,
  label: string,
  before: string,
  after: string
): TemplatePart {
  return {
    kind: 'field',
    field: { kind: 'optional', id, label, before, after },
  };
}

function fieldsOf(template: PromptTemplate) {
  const fields: TemplateField[] = [];
  for (const part of template.parts) {
    if (part.kind === 'field') {
      fields.push(part.field);
    }
  }
  return fields;
}

function valueOf(values: TemplateValues, field: TemplateField) {
  const value = values[field.id] ?? '';
  return value.trim();
}

function isFilled(values: TemplateValues, field: TemplateField) {
  return valueOf(values, field) !== '';
}

function isRequired(field: TemplateField) {
  return field.kind !== 'optional';
}

export function missingFieldOf(
  template: PromptTemplate,
  values: TemplateValues
) {
  const fields = fieldsOf(template);
  return fields.find((field) => {
    const required = isRequired(field);
    const empty = !isFilled(values, field);
    return required && empty;
  });
}

function filledCountOf(template: PromptTemplate, values: TemplateValues) {
  const fields = fieldsOf(template);
  const filled = fields.filter((field) => isFilled(values, field));
  return filled.length;
}

/** The prompt as it will be sent: values in place, an empty optional field leaves with its words. */
export function finalPromptOf(
  template: PromptTemplate,
  values: TemplateValues
) {
  const pieces: string[] = [];
  for (const part of template.parts) {
    if (part.kind === 'text') {
      pieces.push(part.text);
      continue;
    }
    const field = part.field;
    const value = valueOf(values, field);
    const isEmpty = value === '';
    if (field.kind === 'optional') {
      if (!isEmpty) {
        pieces.push(`${field.before}${value}${field.after}`);
      }
      continue;
    }
    if (isEmpty) {
      pieces.push(`[${field.label}]`);
      continue;
    }
    pieces.push(value);
  }
  return pieces.join('');
}

/** About four characters a token: an estimate, shown as one. */
function tokenEstimateOf(prompt: string) {
  return Math.ceil(prompt.length / 4);
}

function searchTextOf(template: PromptTemplate) {
  const words: string[] = [template.title];
  for (const part of template.parts) {
    if (part.kind === 'text') {
      words.push(part.text);
      continue;
    }
    words.push(part.field.label);
  }
  return words.join(' ');
}

function actionLabelOf(missing: TemplateField | undefined) {
  if (!missing) {
    return 'Use prompt';
  }
  if (missing.kind === 'choice') {
    return `Pick a ${missing.label}`;
  }
  return `Add ${missing.label}`;
}

function fieldToneOf(field: TemplateField, isEmpty: boolean) {
  const isOptional = field.kind === 'optional';
  const isOpenSlot = isOptional && isEmpty;
  if (isOpenSlot) {
    return 'hairline-border border-dashed border-foreground/30 bg-transparent';
  }
  if (isEmpty) {
    return 'bg-card hairline-ring ring-foreground/15 dark:bg-foreground/[0.04]';
  }
  return 'bg-primary/[0.08] hairline-ring ring-primary/25';
}

const INLINE_FOCUS =
  'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25';

type InlineTextProps = {
  field: TemplateField;
  value: string;
  onChange: (value: string) => void;
};

function InlineText({ field, value, onChange }: InlineTextProps) {
  const isEmpty = value.trim() === '';
  const sizer = sizerTextOf(value, field.label);

  return (
    <span className='inline-grid max-w-full align-baseline'>
      <span
        aria-hidden='true'
        className='invisible col-start-1 row-start-1 truncate px-1.5 text-[13px] whitespace-pre'
      >
        {sizer}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.label}
        aria-label={labelOf(field)}
        className={cn(
          'placeholder:text-muted-foreground/80 col-start-1 row-start-1 h-6 w-full min-w-0 rounded-md px-1.5 text-[13px] transition-[background-color,box-shadow] duration-150',
          INLINE_FOCUS,
          fieldToneOf(field, isEmpty)
        )}
      />
    </span>
  );
}

function sizerTextOf(value: string, label: string) {
  if (value === '') {
    return label;
  }
  return value;
}

function labelOf(field: TemplateField) {
  if (field.kind === 'optional') {
    return `${field.label}, optional`;
  }
  return field.label;
}

type InlineChoiceProps = {
  field: Extract<TemplateField, { kind: 'choice' }>;
  value: string;
  onChange: (value: string) => void;
};

function InlineChoice({ field, value, onChange }: InlineChoiceProps) {
  const isEmpty = value === '';
  const items = field.options.map((option) => ({
    value: option,
    label: option,
  }));

  function change(next: unknown) {
    if (typeof next === 'string') {
      onChange(next);
    }
  }

  return (
    <Select items={items} value={selectValueOf(value)} onValueChange={change}>
      <SelectTrigger
        size='sm'
        aria-label={field.label}
        className={cn(
          'inline-flex h-6 w-auto gap-1 px-1.5 align-baseline text-[13px] shadow-none md:text-[13px]',
          fieldToneOf(field, isEmpty)
        )}
      >
        <SelectValue placeholder={field.label} />
      </SelectTrigger>
      <SelectContent>
        {field.options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function selectValueOf(value: string) {
  if (value === '') {
    return null;
  }
  return value;
}

type TemplateSentenceProps = {
  template: PromptTemplate;
  values: TemplateValues;
  onValueChange: (fieldId: string, value: string) => void;
};

export function TemplateSentence({
  template,
  values,
  onValueChange,
}: TemplateSentenceProps) {
  return (
    <div className='text-[15px] leading-9 text-pretty'>
      {template.parts.map((part, index) => {
        if (part.kind === 'text') {
          return <span key={index}>{part.text}</span>;
        }
        const field = part.field;
        const value = values[field.id] ?? '';
        const change = (next: string) => onValueChange(field.id, next);
        if (field.kind === 'choice') {
          return (
            <InlineChoice
              key={field.id}
              field={field}
              value={value}
              onChange={change}
            />
          );
        }
        if (field.kind === 'optional') {
          return (
            <span key={field.id}>
              <span className='text-muted-foreground'>{field.before}</span>
              <InlineText field={field} value={value} onChange={change} />
              <span className='text-muted-foreground'>{field.after}</span>
            </span>
          );
        }
        return (
          <InlineText
            key={field.id}
            field={field}
            value={value}
            onChange={change}
          />
        );
      })}
    </div>
  );
}

function PreviewText({
  template,
  values,
}: {
  template: PromptTemplate;
  values: TemplateValues;
}) {
  return (
    <p className='text-[13px] leading-6 text-pretty whitespace-pre-wrap'>
      {template.parts.map((part, index) => {
        if (part.kind === 'text') {
          return <span key={index}>{part.text}</span>;
        }
        const field = part.field;
        const value = valueOf(values, field);
        const isEmpty = value === '';
        if (field.kind === 'optional') {
          if (isEmpty) {
            return null;
          }
          return (
            <span key={field.id}>
              {field.before}
              <span className='text-primary-ink'>{value}</span>
              {field.after}
            </span>
          );
        }
        if (isEmpty) {
          return (
            <span
              key={field.id}
              className='bg-warning/15 text-warning-foreground rounded-[3px] px-0.5'
            >
              [{field.label}]
            </span>
          );
        }
        return (
          <span key={field.id} className='text-primary-ink'>
            {value}
          </span>
        );
      })}
    </p>
  );
}

const MORPH_HOLD_MS = 650;

const DONE_HOLD_MS = 1500;

export type TemplateEditorHandle = {
  /** Shows Use prompt held down. */
  press: () => void;
  /** Sends the prompt, as Use prompt does. */
  use: () => void;
};

type TemplateEditorProps = {
  template: PromptTemplate;
  values: TemplateValues;
  onValueChange: (fieldId: string, value: string) => void;
  onUse: (prompt: string) => void;
  handleRef?: React.Ref<TemplateEditorHandle>;
};

export function TemplateEditor({
  template,
  values,
  onValueChange,
  onUse,
  handleRef,
}: TemplateEditorProps) {
  const [sendState, setSendState] = useState<MorphState>('idle');
  const { schedule } = useTimeouts();
  const { pressed, press } = usePress<'use'>();
  const fields = fieldsOf(template);
  const filledCount = filledCountOf(template, values);
  const missing = missingFieldOf(template, values);
  const isReady = missing === undefined;
  const prompt = finalPromptOf(template, values);
  const tokens = tokenEstimateOf(prompt);
  const actionLabel = actionLabelOf(missing);
  const filledWords = [
    {
      key: 'filled',
      text: String(filledCount),
      node: <MotionNumber value={filledCount} />,
    },
    'of',
    String(fields.length),
    'filled',
  ];

  function use() {
    if (!isReady) {
      return;
    }
    setSendState('busy');
    schedule(() => {
      setSendState('done');
      onUse(prompt);
    }, MORPH_HOLD_MS);
    schedule(() => setSendState('idle'), MORPH_HOLD_MS + DONE_HOLD_MS);
  }

  useImperativeHandle(handleRef, () => ({
    press: () => press('use'),
    use,
  }));

  return (
    <div className='flex min-w-0 flex-col gap-4'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-baseline justify-between gap-3'>
          <h3 className='text-sm font-medium'>{template.title}</h3>
          <p className='text-muted-foreground shrink-0 text-xs'>
            <WordRoll words={filledWords} value={filledCount} />
          </p>
        </div>
        <TemplateSentence
          template={template}
          values={values}
          onValueChange={onValueChange}
        />
      </div>
      <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex flex-col gap-3 rounded-lg p-3'>
        <div className='flex items-center justify-between gap-2'>
          <p className='text-muted-foreground text-xs'>Preview</p>
          <p className='text-muted-foreground text-xs'>
            about <MotionNumber value={tokens} /> tokens
          </p>
        </div>
        <AnimatedSize>
          <PreviewText template={template} values={values} />
        </AnimatedSize>
        <div className='flex flex-wrap items-center justify-end gap-2'>
          <CopyButton
            text={prompt}
            label='Copy the prompt'
            className='size-8'
          />
          <MorphButton
            type='button'
            size='sm'
            state={sendState}
            labels={{
              idle: actionLabel,
              busy: 'Sending',
              done: 'In the composer',
            }}
            disabled={!isReady}
            onClick={use}
            className={pressedSolidOf(pressed === 'use')}
          />
        </div>
      </div>
    </div>
  );
}

function listToneOf(isActive: boolean) {
  if (isActive) {
    return 'text-foreground';
  }
  return 'text-muted-foreground hover:text-foreground';
}

function stepOf(key: string) {
  if (key === 'ArrowDown') {
    return 1;
  }
  if (key === 'ArrowUp') {
    return -1;
  }
  return 0;
}

type TemplateListProps = {
  templates: PromptTemplate[];
  activeId: string;
  onActivate: (templateId: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
};

function TemplateList({
  templates,
  activeId,
  onActivate,
  query,
  onQueryChange,
}: TemplateListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const highlightId = useId();
  const searchId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const spring = springOf(shouldReduceMotion);
  const matching = templates.filter((template) =>
    includesQuery(searchTextOf(template), query)
  );
  const isEmpty = matching.length === 0;
  const trimmed = query.trim();
  const tabStopId = tabStopOf(activeId, matching);

  function moveFromKeys(event: React.KeyboardEvent<HTMLButtonElement>) {
    const step = stepOf(event.key);
    if (step === 0) {
      return;
    }
    event.preventDefault();
    const index = matching.findIndex((template) => template.id === activeId);
    const moved = index + step;
    const bounded = Math.min(matching.length - 1, Math.max(0, moved));
    const next = matching[bounded];
    onActivate(next.id);
    requestAnimationFrame(() => {
      const button = listRef.current?.querySelector<HTMLElement>(
        `[data-template="${next.id}"]`
      );
      button?.focus();
    });
  }

  return (
    <div className='flex min-w-0 flex-col gap-2'>
      <div className='relative'>
        <label htmlFor={searchId} className='sr-only'>
          Search templates
        </label>
        <SearchIcon className='text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2' />
        <Input
          id={searchId}
          type='search'
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder='Search templates'
          className='ps-8'
        />
      </div>
      <ul ref={listRef} aria-label='Templates' className='flex flex-col'>
        {matching.map((template) => {
          const isActive = template.id === activeId;
          const fieldCount = fieldsOf(template).length;
          return (
            <li key={template.id}>
              <button
                type='button'
                data-template={template.id}
                aria-current={currentOf(isActive)}
                tabIndex={tabIndexOf(template.id, tabStopId)}
                onClick={() => onActivate(template.id)}
                onKeyDown={moveFromKeys}
                className={cn(
                  'focus-visible:ring-ring/25 relative flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-start outline-none focus-visible:ring-[3px]',
                  listToneOf(isActive)
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId={highlightId}
                    layoutDependency={activeId}
                    transition={spring}
                    aria-hidden='true'
                    className='bg-foreground/[0.05] dark:bg-foreground/[0.07] absolute inset-0 rounded-md'
                  />
                )}
                <FileTextIcon className='relative size-4 shrink-0' />
                <span className='relative min-w-0 flex-1'>
                  <span className='block truncate text-[13px] font-medium'>
                    <Marked text={template.title} query={query} />
                  </span>
                  <span className='text-muted-foreground block text-xs'>
                    {countOf(fieldCount, 'field')}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {isEmpty && (
        <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex flex-col items-center gap-2 rounded-lg px-3 py-5 text-center'>
          <p className='text-muted-foreground text-[13px]'>
            No template matches “{trimmed}”
          </p>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => onQueryChange('')}
          >
            <XIcon />
            Clear the search
          </Button>
        </div>
      )}
    </div>
  );
}

function currentOf(isActive: boolean) {
  if (isActive) {
    return 'true';
  }
  return undefined;
}

/** One tab stop for the list: the active template, or the first one when the active one is filtered out. */
function tabStopOf(activeId: string, matching: PromptTemplate[]) {
  const isActiveShown = matching.some((template) => template.id === activeId);
  if (isActiveShown) {
    return activeId;
  }
  return matching[0]?.id;
}

function tabIndexOf(templateId: string, tabStopId: string | undefined) {
  if (templateId === tabStopId) {
    return 0;
  }
  return -1;
}

export type PromptTemplatesHandle = {
  /** Opens a template, as a click on its row does. */
  activate: (templateId: string) => void;
  /** Writes into a blank of the open template, as typing or picking does. */
  fill: (fieldId: string, value: string) => void;
  /** Shows Use prompt held down. */
  press: () => void;
  use: () => void;
  /** Back to the first template, the first values and an empty search. */
  reset: () => void;
};

export type PromptTemplatesProps = {
  templates: PromptTemplate[];
  initialValues?: Record<string, TemplateValues>;
  onUse: (prompt: string) => void;
  /** Runs what the list and the editor do, for a demonstration or a control beside them. */
  handleRef?: React.Ref<PromptTemplatesHandle>;
  className?: string;
};

const EDITOR_ARRIVAL = { duration: 0.2 };

export function PromptTemplates({
  templates,
  initialValues = {},
  onUse,
  handleRef,
  className,
}: PromptTemplatesProps) {
  const firstId = templates[0]?.id ?? '';
  const [activeId, setActiveId] = useState(firstId);
  const [query, setQuery] = useState('');
  const [values, setValues] =
    useState<Record<string, TemplateValues>>(initialValues);
  const editor = useRef<TemplateEditorHandle>(null);
  const active = templates.find((template) => template.id === activeId);

  function changeValue(fieldId: string, value: string) {
    setValues((current) => {
      const forTemplate = current[activeId] ?? {};
      const nextForTemplate = { ...forTemplate, [fieldId]: value };
      return { ...current, [activeId]: nextForTemplate };
    });
  }

  function reset() {
    setActiveId(firstId);
    setQuery('');
    setValues(initialValues);
  }

  useImperativeHandle(handleRef, () => ({
    activate: setActiveId,
    fill: changeValue,
    press: () => editor.current?.press(),
    use: () => editor.current?.use(),
    reset,
  }));

  return (
    <div className={cn('@container', className)}>
      <div className='grid gap-4 @xl:grid-cols-[13rem_minmax(0,1fr)] @xl:gap-5'>
        <TemplateList
          templates={templates}
          activeId={activeId}
          onActivate={setActiveId}
          query={query}
          onQueryChange={setQuery}
        />
        <AnimatePresence initial={false}>
          {active && (
            <motion.div
              key={active.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={EDITOR_ARRIVAL}
              className='min-w-0'
            >
              <TemplateEditor
                template={active}
                values={values[active.id] ?? {}}
                onValueChange={changeValue}
                onUse={onUse}
                handleRef={editor}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const TEMPLATES: PromptTemplate[] = [
  {
    id: 'follow-up',
    title: 'Follow-up email',
    parts: [
      text('Write a '),
      oneOf('tone', 'tone', ['friendly', 'formal', 'short']),
      text(' follow-up to '),
      blank('customer', 'the customer'),
      text(' about '),
      blank('topic', 'the topic'),
      text('.'),
      maybe('detail', 'a detail', ' Mention ', '.'),
    ],
  },
  {
    id: 'summary',
    title: 'Summarize a document',
    parts: [
      text('Summarize '),
      blank('document', 'the document'),
      text(' for '),
      oneOf('audience', 'reader', ['the team', 'a customer', 'an executive']),
      text(' in '),
      oneOf('length', 'length', ['3', '5', '10']),
      text(' bullet points.'),
      maybe('focus', 'a topic', ' Focus on ', '.'),
    ],
  },
  {
    id: 'triage',
    title: 'Triage a bug report',
    parts: [
      text('Read the bug report from '),
      blank('reporter', 'the reporter'),
      text(' and rate it '),
      oneOf('severity', 'severity', ['low', 'medium', 'high', 'critical']),
      text('.'),
      maybe('next', 'a next step', ' Suggest ', '.'),
    ],
  },
  {
    id: 'agenda',
    title: 'Meeting agenda',
    parts: [
      text('Draft a '),
      oneOf('duration', 'length', ['15 minute', '30 minute', 'one hour']),
      text(' agenda for '),
      blank('meeting', 'the meeting'),
      text(' with '),
      blank('people', 'the attendees'),
      text('.'),
      maybe('time', 'a topic', ' Leave time for ', '.'),
    ],
  },
  {
    id: 'release',
    title: 'Release notes',
    parts: [
      text('Turn the changes in '),
      blank('version', 'the version'),
      text(' into release notes for '),
      oneOf('readers', 'reader', [
        'customers',
        'the support team',
        'developers',
      ]),
      text('.'),
    ],
  },
];

const SEED_VALUES: Record<string, TemplateValues> = {
  'follow-up': { tone: 'friendly', customer: 'Dana Ruiz' },
  summary: { document: 'the Q3 vendor review', audience: 'an executive' },
};

type DemoBlank = {
  fieldId: string;
  value: string;
  /** A text is typed key by key, a choice is picked at once. */
  isTyped: boolean;
};

type DemoFill = {
  templateId: string;
  blanks: DemoBlank[];
};

/** A round opens one of these templates and fills its blanks, a different one each time. */
const DEMO_FILLS: DemoFill[] = [
  {
    templateId: 'triage',
    blanks: [
      { fieldId: 'reporter', value: 'Mina Okafor', isTyped: true },
      { fieldId: 'severity', value: 'high', isTyped: false },
      { fieldId: 'next', value: 'a rollback plan', isTyped: true },
    ],
  },
  {
    templateId: 'agenda',
    blanks: [
      { fieldId: 'duration', value: '30 minute', isTyped: false },
      { fieldId: 'meeting', value: 'the launch review', isTyped: true },
      { fieldId: 'people', value: 'Priya and Jonas', isTyped: true },
    ],
  },
];

export default function Prompt07() {
  const [message, setMessage] = useState('');
  const [round, setRound] = useState(0);
  const templates = useRef<PromptTemplatesHandle>(null);
  const fill = DEMO_FILLS[round % DEMO_FILLS.length];

  function use(prompt: string) {
    setMessage(`Prompt placed in the composer: ${prompt}`);
  }

  function resetDemo() {
    templates.current?.reset();
    setMessage('');
    setRound((current) => current + 1);
  }

  function stepsOfBlank(blank: DemoBlank): AutoplayStep[] {
    if (!blank.isTyped) {
      return [
        {
          after: 800,
          run: () => templates.current?.fill(blank.fieldId, blank.value),
        },
      ];
    }
    return prefixesOf(blank.value).map((typed, index) => ({
      after: keyDelayOf(index, 800, 55),
      run: () => templates.current?.fill(blank.fieldId, typed),
    }));
  }

  const steps: AutoplayStep[] = [
    { after: 1600, run: () => templates.current?.activate(fill.templateId) },
    ...fill.blanks.flatMap(stepsOfBlank),
    { after: 900, run: () => templates.current?.press() },
    { after: PRESS_LEAD_MS, run: () => templates.current?.use() },
    { after: MORPH_HOLD_MS + DONE_HOLD_MS + 300, run: hold },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 2400,
    onReset: resetDemo,
  });

  useKeptHeight(ref);

  return (
    <div ref={ref} className='flex w-full max-w-[44rem] flex-col gap-3'>
      <PromptTemplates
        templates={TEMPLATES}
        initialValues={SEED_VALUES}
        onUse={use}
        handleRef={templates}
        className='bg-card hairline-ring ring-border rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      />
      <LiveRegion message={spokenUnless(isAutoplaying, message)} />
    </div>
  );
}
