'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import {
  ArrowRightIcon,
  FilterIcon,
  ZapIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Switch } from '@/registry/ndeko/ui/switch';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import {
  INITIAL_RULE,
  MATCH_MODES,
  RULE_NAME,
  TRIGGERS,
  WORKSPACE_LINE,
  type Action,
  type ActionKind,
  type Condition,
  type FieldId,
  type MatchMode,
  type Rule,
  type TriggerId,
} from './data';
import { useHeightPresence } from './motion-parts';
import {
  ActionRow,
  AddSlot,
  ChoiceSelect,
  ConditionRow,
  RowError,
  Step,
} from './rule-parts';
import {
  ACTIONS_ERROR_KEY,
  actionForKind,
  conditionForField,
  errorsOf,
  hasErrors,
  replacedById,
  sameRule,
  sentenceOf,
  unusedActionKindOf,
  unusedFieldOf,
  withoutId,
  type RuleErrors,
} from './rule-model';
import { SaveButton, type SaveStatus } from './save-button';

const CARD_SURFACE =
  'bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-foreground/[0.03]';

const SAVING_MS = 800;

const SAVED_HOLD_MS = 1200;

const FIRST_FREE_ID = 3;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const NO_ERRORS: RuleErrors = {};

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function shownErrorsOf(errors: RuleErrors, showsErrors: boolean) {
  if (showsErrors) {
    return errors;
  }
  return NO_ERRORS;
}

function delayOf(status: SaveStatus) {
  if (status === 'saving') {
    return SAVING_MS;
  }
  return SAVED_HOLD_MS;
}

function statusAfter(status: SaveStatus): SaveStatus {
  if (status === 'saving') {
    return 'saved';
  }
  return 'idle';
}

function conditionsHintOf(count: number, match: MatchMode) {
  if (count === 0) {
    return 'No condition: the rule runs every time';
  }
  if (count === 1) {
    return 'The rule runs only when this is true';
  }
  if (match === 'any') {
    return 'The rule runs when any of these is true';
  }
  return 'The rule runs when all of these are true';
}

function activeLabelOf(isActive: boolean) {
  if (isActive) {
    return 'Active';
  }
  return 'Paused';
}

function footerNoteOf(isDirty: boolean, status: SaveStatus) {
  if (status === 'saved') {
    return 'Rule saved';
  }
  if (isDirty) {
    return 'Unsaved changes';
  }
  return 'No changes';
}

function focusFirstControlOf(rowId: string) {
  const row = document.querySelector(`[data-rule-row="${rowId}"]`);
  const control = row?.querySelector<HTMLElement>('button, input');
  control?.focus();
}

function isMatchMode(value: unknown): value is MatchMode {
  return MATCH_MODES.some((mode) => mode.value === value);
}

type MatchSwitchProps = {
  value: MatchMode;
  onValueChange: (value: MatchMode) => void;
};

function MatchSwitch({ value, onValueChange }: MatchSwitchProps) {
  function changeValue(nextValue: unknown) {
    if (isMatchMode(nextValue)) {
      onValueChange(nextValue);
    }
  }

  return (
    <Tabs value={value} onValueChange={changeValue}>
      <TabsList variant='segmented' aria-label='Conditions to match'>
        {MATCH_MODES.map((mode) => (
          <TabsTab key={mode.value} value={mode.value}>
            {mode.label}
          </TabsTab>
        ))}
      </TabsList>
    </Tabs>
  );
}

function ActiveLabel({ isActive }: { isActive: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);
  const label = activeLabelOf(isActive);

  return (
    <span className='relative inline-flex w-12'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={label}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function Automations01() {
  const [rule, setRule] = useState<Rule>(INITIAL_RULE);
  const [savedRule, setSavedRule] = useState<Rule>(INITIAL_RULE);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [showsErrors, setShowsErrors] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const nextIdRef = useRef(FIRST_FREE_ID);
  const addConditionRef = useRef<HTMLButtonElement>(null);
  const addActionRef = useRef<HTMLButtonElement>(null);
  const heightPresence = useHeightPresence();
  const shouldReduceMotion = useReducedMotion();
  const switchVariants = swapVariantsOf(shouldReduceMotion);
  const errors = errorsOf(rule);
  const shownErrors = shownErrorsOf(errors, showsErrors);
  const isDirty = !sameRule(rule, savedRule);
  const conditionCount = rule.conditions.length;
  const hasSeveralConditions = conditionCount > 1;
  const sentence = sentenceOf(rule);
  const footerNote = footerNoteOf(isDirty, status);

  useEffect(() => {
    if (status === 'idle') {
      return;
    }
    function advance() {
      const next = statusAfter(status);
      setStatus(next);
    }
    const delay = delayOf(status);
    const timer = window.setTimeout(advance, delay);
    return () => window.clearTimeout(timer);
  }, [status]);

  function nextIdOf(prefix: string) {
    const id = `${prefix}-${nextIdRef.current}`;
    nextIdRef.current += 1;
    return id;
  }

  function patchRule(patch: Partial<Rule>) {
    setRule((current) => ({ ...current, ...patch }));
  }

  function changeTrigger(trigger: TriggerId) {
    patchRule({ trigger });
  }

  function changeMatch(match: MatchMode) {
    patchRule({ match });
  }

  function addCondition() {
    const id = nextIdOf('condition');
    const field = unusedFieldOf(rule.conditions);
    const condition = conditionForField(id, field);
    const conditions = [...rule.conditions, condition];
    patchRule({ conditions });
    window.requestAnimationFrame(() => focusFirstControlOf(id));
  }

  function changeCondition(condition: Condition) {
    const conditions = replacedById(rule.conditions, condition);
    patchRule({ conditions });
  }

  function changeConditionField(id: string, field: FieldId) {
    const condition = conditionForField(id, field);
    changeCondition(condition);
  }

  function removeCondition(id: string) {
    const conditions = withoutId(rule.conditions, id);
    patchRule({ conditions });
    addConditionRef.current?.focus();
  }

  function addAction() {
    const id = nextIdOf('action');
    const kind = unusedActionKindOf(rule.actions);
    const action = actionForKind(id, kind);
    const actions = [...rule.actions, action];
    patchRule({ actions });
    window.requestAnimationFrame(() => focusFirstControlOf(id));
  }

  function changeAction(action: Action) {
    const actions = replacedById(rule.actions, action);
    patchRule({ actions });
  }

  function changeActionKind(id: string, kind: ActionKind) {
    const action = actionForKind(id, kind);
    changeAction(action);
  }

  function removeAction(id: string) {
    const actions = withoutId(rule.actions, id);
    patchRule({ actions });
    addActionRef.current?.focus();
  }

  function discard() {
    setRule(savedRule);
    setShowsErrors(false);
  }

  function save() {
    if (hasErrors(errors)) {
      setShowsErrors(true);
      return;
    }
    setShowsErrors(false);
    setSavedRule(rule);
    setStatus('saving');
  }

  return (
    <div className='bg-background text-foreground min-h-dvh w-full'>
      <div className='mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 md:px-6 md:py-10'>
        <header className='flex flex-col gap-1'>
          <p className='text-muted-foreground text-xs'>{WORKSPACE_LINE}</p>
          <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2'>
            <h1 className='text-lg font-semibold text-balance'>{RULE_NAME}</h1>
            <label className='flex cursor-pointer items-center gap-2 text-[13px]'>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <ActiveLabel isActive={isActive} />
            </label>
          </div>
        </header>
        <div className={`${CARD_SURFACE} p-4 pb-0 sm:p-6 sm:pb-0`}>
          <Step
            icon={ZapIcon}
            title='When'
            hint='The event that starts the rule'
          >
            <ChoiceSelect
              label='Event'
              value={rule.trigger}
              options={TRIGGERS}
              onValueChange={changeTrigger}
              className='sm:w-64'
            />
          </Step>
          <Step
            icon={FilterIcon}
            title='If'
            hint={conditionsHintOf(conditionCount, rule.match)}
            aside={
              <AnimatePresence initial={false}>
                {hasSeveralConditions && (
                  <motion.div
                    key='match'
                    variants={switchVariants}
                    initial='enter'
                    animate='visible'
                    exit='exit'
                    transition={SWAP_TRANSITION}
                  >
                    <MatchSwitch
                      value={rule.match}
                      onValueChange={changeMatch}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            }
          >
            <div className='flex flex-col'>
              <ul aria-label='Conditions' className='flex flex-col'>
                <AnimatePresence initial={false}>
                  {rule.conditions.map((condition) => (
                    <motion.li
                      key={condition.id}
                      data-rule-row={condition.id}
                      {...heightPresence}
                      className='overflow-hidden'
                    >
                      <div className='pb-2'>
                        <ConditionRow
                          condition={condition}
                          error={shownErrors[condition.id]}
                          onFieldChange={(field) =>
                            changeConditionField(condition.id, field)
                          }
                          onChange={changeCondition}
                          onRemove={() => removeCondition(condition.id)}
                        />
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              <AddSlot
                ref={addConditionRef}
                label='Add condition'
                onAdd={addCondition}
              />
            </div>
          </Step>
          <Step
            icon={ArrowRightIcon}
            title='Then'
            hint='What happens, in this order'
            isLast
          >
            <div className='flex flex-col'>
              <ol aria-label='Actions' className='flex flex-col'>
                <AnimatePresence initial={false}>
                  {rule.actions.map((action) => (
                    <motion.li
                      key={action.id}
                      data-rule-row={action.id}
                      {...heightPresence}
                      className='overflow-hidden'
                    >
                      <div className='pb-2'>
                        <ActionRow
                          action={action}
                          onKindChange={(kind) =>
                            changeActionKind(action.id, kind)
                          }
                          onChange={changeAction}
                          onRemove={() => removeAction(action.id)}
                        />
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ol>
              <AddSlot
                ref={addActionRef}
                label='Add action'
                onAdd={addAction}
              />
              <RowError
                id='automations-01-actions-error'
                error={shownErrors[ACTIONS_ERROR_KEY]}
              />
            </div>
          </Step>
        </div>
        <section
          aria-labelledby='automations-01-sentence'
          className='bg-foreground/[0.025] flex flex-col gap-1 rounded-xl px-4 py-3'
        >
          <h2
            id='automations-01-sentence'
            className='text-muted-foreground text-xs'
          >
            The rule reads
          </h2>
          <p className='text-[13px] leading-relaxed text-pretty'>{sentence}</p>
        </section>
        <div className='flex flex-wrap items-center justify-end gap-2'>
          <p role='status' className='text-muted-foreground me-auto text-xs'>
            {footerNote}
          </p>
          <Button variant='ghost' disabled={!isDirty} onClick={discard}>
            Discard
          </Button>
          <SaveButton
            status={status}
            idleLabel='Save rule'
            disabled={!isDirty}
            onSave={save}
          />
        </div>
      </div>
    </div>
  );
}
