'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';

import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { MEMBERS, type Activity, type ActivityKind, type Member } from './data';
import { IssueTypeGem, MemberAvatar, rowCollapseOf } from './parts';

const COLLAPSED_LIMIT = 4;

const VERBS: Record<ActivityKind, string> = {
  closed: 'closed',
  commented: 'commented on',
  moved: 'moved',
  created: 'created',
};

function memberOf(memberId: string): Member {
  const found = MEMBERS.find((member) => member.id === memberId);
  if (found) {
    return found;
  }
  return MEMBERS[0];
}

function moreLabelOf(hiddenCount: number, isExpanded: boolean) {
  if (isExpanded) {
    return 'Show less';
  }
  if (hiddenCount === 1) {
    return 'Show 1 more';
  }
  return `Show ${hiddenCount} more`;
}

function visibleActivityOf(activity: Activity[], isExpanded: boolean) {
  if (isExpanded) {
    return activity;
  }
  return activity.slice(0, COLLAPSED_LIMIT);
}

function isQuote(activity: Activity) {
  const hasDetail = activity.detail !== undefined;
  const isComment = activity.kind === 'commented';
  return hasDetail && isComment;
}

function suffixOf(activity: Activity) {
  const hasDetail = activity.detail !== undefined;
  const isMove = activity.kind === 'moved';
  if (hasDetail && isMove) {
    return ` ${activity.detail}`;
  }
  return '';
}

function ActivityRow({ activity }: { activity: Activity }) {
  const shouldReduceMotion = useReducedMotion();
  const member = memberOf(activity.memberId);

  return (
    <motion.li
      variants={rowCollapseOf(shouldReduceMotion)}
      initial='hidden'
      animate='shown'
      exit='hidden'
      className='overflow-hidden'
    >
      <div className='flex items-start gap-3 pb-4'>
        <MemberAvatar member={member} />
        <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
          <p className='text-muted-foreground text-[13px] leading-5'>
            <span className='text-foreground font-medium'>{member.name}</span>{' '}
            {VERBS[activity.kind]}{' '}
            <span className='text-foreground inline-flex items-baseline gap-1'>
              <span className='self-center'>
                <IssueTypeGem type={activity.task.type} />
              </span>
              <span className='tabular-nums'>{activity.task.key}</span>
            </span>{' '}
            {activity.task.title}
            {suffixOf(activity)}
          </p>
          {isQuote(activity) && (
            <p className='bg-foreground/[0.025] hairline-ring ring-border rounded-lg px-3 py-2 text-[13px] leading-5'>
              {activity.detail}
            </p>
          )}
        </div>
        <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
          {activity.age}
        </span>
      </div>
    </motion.li>
  );
}

type ActivityFeedProps = {
  activity: Activity[];
};

export function ActivityFeed({ activity }: ActivityFeedProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visible = visibleActivityOf(activity, isExpanded);
  const hiddenCount = activity.length - visible.length;
  const hasMore = activity.length > COLLAPSED_LIMIT;

  function toggleExpanded() {
    setIsExpanded((current) => !current);
  }

  return (
    <div className='flex flex-col'>
      <ul aria-label='Activity' className='flex flex-col'>
        <AnimatePresence initial={false}>
          {visible.map((item) => (
            <ActivityRow key={item.id} activity={item} />
          ))}
        </AnimatePresence>
      </ul>
      {hasMore && (
        <div>
          <Button
            variant='ghost'
            size='sm'
            aria-expanded={isExpanded}
            onClick={toggleExpanded}
            className='text-muted-foreground -ms-2'
          >
            <ChevronDownIcon
              className={cn(
                'transition-transform duration-200 ease-(--ease-out-strong)',
                isExpanded && 'rotate-180'
              )}
            />
            {moreLabelOf(hiddenCount, isExpanded)}
          </Button>
        </div>
      )}
    </div>
  );
}
