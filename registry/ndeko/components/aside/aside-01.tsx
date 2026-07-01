'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import {
  CalendarIcon,
  CircleDashedIcon,
  ClockIcon,
  HashIcon,
  MessageCircleIcon,
  PlusIcon,
  SendIcon,
  StarIcon,
  UsersIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Chip } from '@/registry/ndeko/ui/chip';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import {
  ASIDE_SURFACE,
  AsideCloseButton,
  AsidePreview,
  AsideTitle,
} from './_parts/aside-frame';
import { CopyIconButton } from './_parts/copy-icon-button';
import { chipVariantsOf, rowVariantsOf } from './_parts/motion';
import { PEOPLE, firstNameOf, peopleByIds } from './_parts/people';
import { PersonAvatar } from './_parts/person-avatar';
import { Swap } from './_parts/swap';
import {
  IssueTypeGem,
  MetaGlyph,
  PRIORITY_META,
  STATUS_META,
  STATUS_ORDER,
  isStatusId,
  type StatusId,
} from './_parts/task-meta';

type SubIssue = { id: string; number: string; title: string; isDone: boolean };

type Comment = { id: string; authorId: string; text: string; time: string };

const TASK_NUMBER = 'LAT-142';

const TASK_LINK = 'https://lattice.example/tasks/LAT-142';

const AUTHOR_ID = 'amara';

const SUB_ISSUES: SubIssue[] = [
  {
    id: 'sub-1',
    number: 'LAT-143',
    title: 'List the steps people skip today',
    isDone: true,
  },
  {
    id: 'sub-2',
    number: 'LAT-144',
    title: 'Draw the checklist at 375 px',
    isDone: true,
  },
  {
    id: 'sub-3',
    number: 'LAT-145',
    title: 'Write the empty state of each step',
    isDone: false,
  },
  {
    id: 'sub-4',
    number: 'LAT-146',
    title: 'Review the flow with support',
    isDone: false,
  },
];

const COMMENTS: Comment[] = [
  {
    id: 'comment-1',
    authorId: 'lucas',
    text: 'The second step can merge with the first on small screens.',
    time: '2 h ago',
  },
  {
    id: 'comment-2',
    authorId: 'priya',
    text: 'I can take the empty states once the copy is in.',
    time: '40 min ago',
  },
];

const RING_RADIUS = 6;

const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

function favouriteLabelOf(isFavourite: boolean) {
  if (isFavourite) {
    return 'Remove from favourites';
  }
  return 'Add to favourites';
}

function starClassOf(isFavourite: boolean) {
  if (isFavourite) {
    return 'text-warning-foreground';
  }
  return 'text-muted-foreground';
}

function PropertyRow({
  icon: RowIcon,
  label,
  children,
}: {
  icon: Icon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='grid min-h-8 grid-cols-[6.5rem_1fr] items-center gap-2'>
      <span className='text-muted-foreground flex items-center gap-2 text-[13px]'>
        <RowIcon className='size-3.5 shrink-0' />
        {label}
      </span>
      <div className='flex min-w-0 flex-wrap items-center gap-1'>
        {children}
      </div>
    </div>
  );
}

function StatusMenu({
  status,
  onChange,
}: {
  status: StatusId;
  onChange: (status: StatusId) => void;
}) {
  const meta = STATUS_META[status];
  const StatusGlyph = meta.icon;
  const chipStyle = { '--chip': meta.color } as React.CSSProperties;

  function changeStatus(value: unknown) {
    if (isStatusId(value)) {
      onChange(value);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type='button'
            aria-label={`Status: ${meta.label}. Change status`}
            style={chipStyle}
            className='chip-3d focus-visible:ring-ring/25 inline-flex h-6 cursor-pointer items-center overflow-hidden rounded-md px-1.5 text-xs font-medium outline-none focus-visible:ring-[3px]'
          />
        }
      >
        <Swap swapKey={status} className='gap-1'>
          <StatusGlyph className='size-3' strokeWidth={2.25} />
          {meta.label}
        </Swap>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-44'>
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={status} onValueChange={changeStatus}>
          {STATUS_ORDER.map((statusId) => (
            <DropdownMenuRadioItem key={statusId} value={statusId} closeOnClick>
              <MetaGlyph meta={STATUS_META[statusId]} className='size-4' />
              {STATUS_META[statusId].label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Assignees({
  assigneeIds,
  onToggle,
}: {
  assigneeIds: string[];
  onToggle: (personId: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const variants = chipVariantsOf(shouldReduceMotion);
  const allowsLayout = !shouldReduceMotion;
  const assignees = peopleByIds(assigneeIds);

  return (
    <>
      <AnimatePresence initial={false} mode='popLayout'>
        {assignees.map((person) => (
          <motion.span
            key={person.id}
            layout={allowsLayout}
            variants={variants}
            initial='hidden'
            animate='shown'
            exit='hidden'
            className='flex'
          >
            <Badge
              variant='secondary'
              className='text-muted-foreground h-6 gap-1.5 pr-2 pl-0.5'
            >
              <PersonAvatar person={person} size='xs' />
              {firstNameOf(person)}
            </Badge>
          </motion.span>
        ))}
      </AnimatePresence>
      <motion.span layout={allowsLayout} className='flex'>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type='button'
                aria-label='Add or remove assignees'
                className='hairline-border border-foreground/25 text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 flex size-6 cursor-pointer items-center justify-center rounded-full border-dashed outline-none focus-visible:ring-[3px]'
              />
            }
          >
            <PlusIcon className='size-3.5' />
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-52'>
            <DropdownMenuLabel>Assignees</DropdownMenuLabel>
            {PEOPLE.map((person) => {
              const isAssigned = assigneeIds.includes(person.id);

              function toggle() {
                onToggle(person.id);
              }

              return (
                <DropdownMenuCheckboxItem
                  key={person.id}
                  checked={isAssigned}
                  onCheckedChange={toggle}
                >
                  <PersonAvatar person={person} size='xs' />
                  {person.name}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.span>
    </>
  );
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const share = done / total;
  const remaining = RING_LENGTH * (1 - share);

  return (
    <svg viewBox='0 0 16 16' aria-hidden='true' className='size-4 -rotate-90'>
      <circle
        cx='8'
        cy='8'
        r={RING_RADIUS}
        fill='none'
        strokeWidth='2'
        className='stroke-foreground/10'
      />
      <circle
        cx='8'
        cy='8'
        r={RING_RADIUS}
        fill='none'
        strokeWidth='2'
        strokeLinecap='round'
        strokeDasharray={RING_LENGTH}
        strokeDashoffset={remaining}
        className='stroke-success transition-[stroke-dashoffset] duration-300 ease-(--ease-out-strong)'
      />
    </svg>
  );
}

function SubIssueRow({
  issue,
  onToggle,
}: {
  issue: SubIssue;
  onToggle: (issueId: string) => void;
}) {
  const checkboxId = useId();

  function toggle() {
    onToggle(issue.id);
  }

  return (
    <li className='flex min-h-8 items-center gap-2.5'>
      <Checkbox
        id={checkboxId}
        checked={issue.isDone}
        onCheckedChange={toggle}
      />
      <label
        htmlFor={checkboxId}
        className='flex min-w-0 flex-1 cursor-pointer items-baseline gap-2 text-[13px]'
      >
        <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
          {issue.number}
        </span>
        <span
          className={cn(
            'truncate decoration-transparent transition-[color,text-decoration-color] duration-200',
            issue.isDone &&
              'text-muted-foreground decoration-muted-foreground/60 line-through'
          )}
        >
          {issue.title}
        </span>
      </label>
    </li>
  );
}

function CommentRow({ comment }: { comment: Comment }) {
  const [author] = peopleByIds([comment.authorId]);
  if (!author) {
    return null;
  }

  return (
    <div className='flex gap-2.5 pb-3'>
      <PersonAvatar person={author} size='sm' />
      <div className='flex min-w-0 flex-col gap-0.5'>
        <p className='text-xs'>
          <span className='font-medium'>{author.name}</span>
          <span className='text-muted-foreground'>{` · ${comment.time}`}</span>
        </p>
        <p className='text-[13px] leading-5'>{comment.text}</p>
      </div>
    </div>
  );
}

function TaskDetails() {
  const [status, setStatus] = useState<StatusId>('in-progress');
  const [isFavourite, setIsFavourite] = useState(false);
  const [assigneeIds, setAssigneeIds] = useState(['amara', 'priya']);
  const [subIssues, setSubIssues] = useState(SUB_ISSUES);
  const [comments, setComments] = useState(COMMENTS);
  const [draft, setDraft] = useState('');
  const shouldReduceMotion = useReducedMotion();
  const rowVariants = rowVariantsOf(shouldReduceMotion);
  const commentFieldId = useId();
  const doneCount = subIssues.filter((issue) => issue.isDone).length;
  const canPost = draft.trim().length > 0;
  const favouriteLabel = favouriteLabelOf(isFavourite);
  const starKey = String(isFavourite);
  const priority = PRIORITY_META.high;
  const PriorityGlyph = priority.icon;

  function toggleFavourite() {
    setIsFavourite((previous) => !previous);
  }

  function toggleAssignee(personId: string) {
    setAssigneeIds((previous) => {
      const isAssigned = previous.includes(personId);
      if (isAssigned) {
        return previous.filter((id) => id !== personId);
      }
      return [...previous, personId];
    });
  }

  function toggleSubIssue(issueId: string) {
    setSubIssues((previous) =>
      previous.map((issue) => {
        if (issue.id !== issueId) {
          return issue;
        }
        return { ...issue, isDone: !issue.isDone };
      })
    );
  }

  function changeDraft(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
  }

  function post() {
    const text = draft.trim();
    if (text.length === 0) {
      return;
    }
    const comment: Comment = {
      id: `comment-${comments.length + 1}`,
      authorId: AUTHOR_ID,
      text,
      time: 'just now',
    };
    setComments((previous) => [...previous, comment]);
    setDraft('');
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    post();
  }

  function postOnShortcut(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const isEnter = event.key === 'Enter';
    const hasModifier = event.metaKey || event.ctrlKey;
    const isShortcut = isEnter && hasModifier;
    if (isShortcut) {
      event.preventDefault();
      post();
    }
  }

  return (
    <div className='flex min-h-full flex-col'>
      <div
        className={cn(
          'sticky top-0 z-10 flex h-12 shrink-0 items-center gap-1 px-3',
          ASIDE_SURFACE
        )}
      >
        <span className='text-muted-foreground flex min-w-0 flex-1 items-center gap-1.5 px-2 text-xs'>
          <span className='truncate'>Product</span>
          <span aria-hidden='true'>/</span>
          <span className='text-foreground tabular-nums'>{TASK_NUMBER}</span>
        </span>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={favouriteLabel}
          aria-pressed={isFavourite}
          onClick={toggleFavourite}
        >
          <Swap swapKey={starKey}>
            <StarIcon className={starClassOf(isFavourite)} />
          </Swap>
        </Button>
        <CopyIconButton
          text={TASK_LINK}
          glyph='link'
          label={`Copy the link to ${TASK_NUMBER}`}
          announcement='Link copied'
        />
        <AsideCloseButton label='Close task' />
      </div>
      <div className='flex flex-1 flex-col gap-6 px-5 pt-1 pb-5'>
        <div className='flex flex-col gap-2'>
          <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
            <IssueTypeGem type='story' />
            <span className='tabular-nums'>{TASK_NUMBER}</span>
            <span aria-hidden='true'>·</span>
            <span>Created Nov 3</span>
          </p>
          <AsideTitle className='text-balance'>
            Redraw the onboarding checklist for small screens
          </AsideTitle>
        </div>
        <div className='flex flex-col gap-0.5'>
          <PropertyRow icon={CircleDashedIcon} label='Status'>
            <StatusMenu status={status} onChange={setStatus} />
          </PropertyRow>
          <PropertyRow icon={priority.icon} label='Priority'>
            <Chip color={priority.color} className='h-6 px-1.5'>
              <PriorityGlyph className='size-3' strokeWidth={2.25} />
              {priority.label}
            </Chip>
          </PropertyRow>
          <PropertyRow icon={UsersIcon} label='Assignees'>
            <Assignees assigneeIds={assigneeIds} onToggle={toggleAssignee} />
          </PropertyRow>
          <PropertyRow icon={HashIcon} label='Labels'>
            <Badge variant='secondary' className='text-muted-foreground h-6'>
              Design
            </Badge>
            <Badge variant='secondary' className='text-muted-foreground h-6'>
              Onboarding
            </Badge>
          </PropertyRow>
          <PropertyRow icon={CalendarIcon} label='Due date'>
            <span className='text-[13px]'>Nov 8</span>
            <span className='text-muted-foreground text-xs'>in 3 days</span>
          </PropertyRow>
          <PropertyRow icon={ClockIcon} label='Estimate'>
            <span className='text-[13px] tabular-nums'>4h</span>
            <span className='text-muted-foreground text-xs tabular-nums'>
              2h 15m logged
            </span>
          </PropertyRow>
        </div>
        <p className='bg-foreground/[0.03] rounded-xl px-3.5 py-3 text-[13px] leading-5'>
          New people skip two of the five steps on a phone. Redraw the list so
          every step fits one screen and says what is left.
        </p>
        <section aria-label='Sub-issues' className='flex flex-col gap-2'>
          <div className='flex items-center gap-2'>
            <h3 className='text-sm font-medium'>Sub-issues</h3>
            <span className='text-muted-foreground ml-auto flex items-center gap-1.5 text-xs'>
              <ProgressRing done={doneCount} total={subIssues.length} />
              <span className='flex tabular-nums'>
                <MotionNumber value={doneCount} />
                {`/${subIssues.length} done`}
              </span>
            </span>
          </div>
          <ul className='flex flex-col'>
            {subIssues.map((issue) => (
              <SubIssueRow
                key={issue.id}
                issue={issue}
                onToggle={toggleSubIssue}
              />
            ))}
          </ul>
        </section>
        <section aria-label='Comments' className='flex flex-col gap-3'>
          <h3 className='flex items-center gap-2 text-sm font-medium'>
            <MessageCircleIcon className='text-muted-foreground size-4' />
            Comments
          </h3>
          <ul className='flex flex-col'>
            <AnimatePresence initial={false}>
              {comments.map((comment) => (
                <motion.li
                  key={comment.id}
                  variants={rowVariants}
                  initial='hidden'
                  animate='shown'
                  exit='hidden'
                >
                  <CommentRow comment={comment} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      </div>
      <form
        onSubmit={submit}
        className={cn(
          'sticky bottom-0 flex items-end gap-2 px-5 pt-2 pb-4',
          ASIDE_SURFACE
        )}
      >
        <label htmlFor={commentFieldId} className='sr-only'>
          Comment
        </label>
        <Textarea
          id={commentFieldId}
          rows={1}
          value={draft}
          placeholder='Leave a comment'
          onChange={changeDraft}
          onKeyDown={postOnShortcut}
          className='min-h-9 py-1.5'
        />
        <Button
          type='submit'
          size='icon'
          aria-label='Post comment'
          disabled={!canPost}
          className='shrink-0'
        >
          <SendIcon />
        </Button>
      </form>
    </div>
  );
}

export default function Aside01() {
  return (
    <AsidePreview triggerLabel='Open task details'>
      <TaskDetails />
    </AsidePreview>
  );
}
