'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';

import {
  roleLabelOf,
  sourceOf,
  stepOf,
  URL_PREFIX,
  type Fields,
  type StepId,
} from './data';
import { CalmCheck } from './drawn-check';

/** The source the workspace starts with: none when the step was skipped. */
function keptSourceOf(fields: Fields, skipped: StepId[]) {
  if (skipped.includes('source')) {
    return null;
  }
  return sourceOf(fields.source);
}

function peopleLineOf(fields: Fields) {
  const count = fields.invites.length;
  const role = roleLabelOf(fields.role);
  if (count === 1) {
    return `1 person invited as ${role}`;
  }
  return `${count} people invited as ${role}`;
}

type ReviewRowProps = {
  step: StepId;
  isLocked: boolean;
  isPressed: boolean;
  onEdit: (step: StepId) => void;
  children: React.ReactNode;
};

/** One thing the wizard will create, with the way back to the step that sets it. */
function ReviewRow({
  step,
  isLocked,
  isPressed,
  onEdit,
  children,
}: ReviewRowProps) {
  const label = stepOf(step).label;

  return (
    <div className='bg-foreground/[0.04] flex flex-col gap-1 rounded-lg p-3'>
      <dt className='text-muted-foreground text-xs'>{label}</dt>
      <dd className='flex items-start gap-3'>
        <div className='flex min-w-0 flex-1 flex-col gap-0.5 text-[13px]'>
          {children}
        </div>
        <Button
          type='button'
          variant='link'
          size='sm'
          aria-label={`Edit ${label}`}
          disabled={isLocked}
          onClick={() => onEdit(step)}
          className={pressedQuietOf(isPressed)}
        >
          Edit
        </Button>
      </dd>
    </div>
  );
}

function Skipped() {
  return <p className='text-muted-foreground'>Skipped. You can do it later</p>;
}

type ReviewStepProps = {
  fields: Fields;
  skipped: StepId[];
  /** While the workspace is being created nothing can be changed any more. */
  isLocked: boolean;
  pressed: string | null;
  onEdit: (step: StepId) => void;
};

export function ReviewStep({
  fields,
  skipped,
  isLocked,
  pressed,
  onEdit,
}: ReviewStepProps) {
  const source = keptSourceOf(fields, skipped);
  const isTeamSkipped = skipped.includes('team') || fields.invites.length === 0;

  return (
    <dl className='flex flex-col gap-2'>
      <ReviewRow
        step='workspace'
        isLocked={isLocked}
        isPressed={pressed === 'edit-workspace'}
        onEdit={onEdit}
      >
        <p className='truncate font-medium'>{fields.name.trim()}</p>
        <p className='text-muted-foreground truncate text-xs'>
          {URL_PREFIX}
          {fields.slug}
        </p>
      </ReviewRow>
      <ReviewRow
        step='source'
        isLocked={isLocked}
        isPressed={pressed === 'edit-source'}
        onEdit={onEdit}
      >
        {!source && <Skipped />}
        {source && (
          <p className='flex min-w-0 items-center gap-2 font-medium'>
            <BrandTile brand={source.brand} />
            <span className='truncate'>
              {source.name}, as {fields.connection.trim()}
            </span>
          </p>
        )}
      </ReviewRow>
      <ReviewRow
        step='team'
        isLocked={isLocked}
        isPressed={pressed === 'edit-team'}
        onEdit={onEdit}
      >
        {isTeamSkipped && <Skipped />}
        {!isTeamSkipped && (
          <>
            <p className='font-medium'>{peopleLineOf(fields)}</p>
            <p className='text-muted-foreground text-xs break-words'>
              {fields.invites.join(', ')}
            </p>
          </>
        )}
      </ReviewRow>
    </dl>
  );
}

/** What the workspace starts with, in one or two short sentences. */
function summaryOf(fields: Fields, skipped: StepId[]) {
  const sentences = [`It lives at ${URL_PREFIX}${fields.slug}.`];
  const source = keptSourceOf(fields, skipped);
  if (source) {
    sentences.push(`${source.name} is connected.`);
  }
  const hasTeam = fields.invites.length > 0 && !skipped.includes('team');
  if (hasTeam) {
    sentences.push(`${peopleLineOf(fields)}.`);
  }
  return sentences.join(' ');
}

type SuccessProps = {
  fields: Fields;
  skipped: StepId[];
  onRestart: () => void;
};

export function Success({ fields, skipped, onRestart }: SuccessProps) {
  return (
    <div
      data-success
      tabIndex={-1}
      className='flex flex-col items-start gap-4 py-1 transition-opacity duration-300 outline-none starting:opacity-0'
    >
      <CalmCheck />
      <div className='flex flex-col gap-1'>
        <h2 className='text-lg font-semibold text-balance'>
          {fields.name.trim()} is ready
        </h2>
        <p className='text-muted-foreground text-[13px] leading-relaxed text-pretty'>
          {summaryOf(fields, skipped)}
        </p>
      </div>
      <Button type='button' variant='outline' onClick={onRestart}>
        Set up another workspace
      </Button>
    </div>
  );
}
