'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import {
  type AutoplayStep,
  useAutoplay,
} from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ArrowUpIcon,
  BookOpenIcon,
  type Icon,
  InboxIcon,
  MessageSquareIcon,
  RouteIcon,
  UsersIcon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';

import {
  ARRIVING,
  type FeatureRequest,
  FILTERS,
  NAV,
  type NavItem,
  REQUESTS,
  type RequestStatus,
  WORKSPACE,
} from './data';

type StatusLook = {
  label: string;
  color: string;
};

const STATUS: Record<RequestStatus, StatusLook> = {
  open: { label: 'Open', color: 'var(--muted-foreground)' },
  planned: { label: 'Planned', color: 'var(--info)' },
  building: { label: 'In progress', color: 'var(--warning)' },
  shipped: { label: 'Shipped', color: 'var(--success)' },
};

const NAV_ICONS: Record<NavItem['id'], Icon> = {
  inbox: InboxIcon,
  requests: MessageSquareIcon,
  roadmap: RouteIcon,
  changelog: BookOpenIcon,
  customers: UsersIcon,
};

const ACTIVE_NAV: NavItem['id'] = 'requests';

const LOOP_AFTER_MS = 3200;

function askedByOf(request: FeatureRequest) {
  if (request.others === 0) {
    return request.company;
  }
  const others = countOf(request.others, 'other');
  return `${request.company} and ${others}`;
}

function withArrival(requests: FeatureRequest[]) {
  const isHere = requests.some((request) => request.id === ARRIVING.id);
  if (isHere) {
    return requests;
  }
  return [ARRIVING, ...requests];
}

/** A vote is one more customer asking, so the line of who asked counts them too. */
function withVote(requests: FeatureRequest[], id: string) {
  return requests.map((request) => {
    if (request.id !== id) {
      return request;
    }
    const votes = request.votes + 1;
    const others = request.others + 1;
    return { ...request, votes, others };
  });
}

function withStatus(
  requests: FeatureRequest[],
  id: string,
  status: RequestStatus
) {
  return requests.map((request) => {
    if (request.id !== id) {
      return request;
    }
    return { ...request, status };
  });
}

function NavRow({ item }: { item: NavItem }) {
  const Glyph = NAV_ICONS[item.id];
  const isActive = item.id === ACTIVE_NAV;
  const hasCount = item.count !== undefined;

  return (
    <li
      className={cn(
        'text-muted-foreground flex h-7 items-center gap-2 rounded-md px-2 text-[13px]',
        isActive && 'bg-foreground/[0.06] text-foreground'
      )}
    >
      <Glyph className='size-4 shrink-0' />
      <span className='min-w-0 flex-1 truncate'>{item.label}</span>
      {hasCount && <span className='text-xs tabular-nums'>{item.count}</span>}
    </li>
  );
}

function Sidebar() {
  return (
    <div className='hidden w-44 shrink-0 flex-col gap-4 p-2 @2xl:flex'>
      <div className='flex items-center gap-2 px-1.5 pt-1'>
        <CompanyMark seed={WORKSPACE} />
        <span className='truncate text-[13px] font-medium'>{WORKSPACE}</span>
      </div>
      <ul className='flex flex-col gap-0.5'>
        {NAV.map((item) => (
          <NavRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

function filterLookOf(index: number) {
  if (index === 0) {
    return 'bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.08)] dark:bg-foreground/[0.09]';
  }
  return 'text-muted-foreground';
}

function ListHeader({ count }: { count: number }) {
  return (
    <div className='flex items-center gap-2 px-4 pt-3.5 pb-2'>
      <span className='text-sm font-medium'>Requests</span>
      <MotionNumber value={count} className='text-muted-foreground text-xs' />
      <span className='bg-foreground/[0.05] ms-auto hidden rounded-lg p-0.5 @md:flex'>
        {FILTERS.map((filter, index) => (
          <span
            key={filter}
            className={cn(
              'rounded-md px-2.5 py-0.5 text-xs',
              filterLookOf(index)
            )}
          >
            {filter}
          </span>
        ))}
      </span>
    </div>
  );
}

function RequestRow({ request }: { request: FeatureRequest }) {
  const status = STATUS[request.status];
  const askedBy = askedByOf(request);

  return (
    <div className='flex items-center gap-3 rounded-lg px-2 py-2'>
      <span className='keycap-3d flex w-10 shrink-0 flex-col items-center gap-0.5 rounded-lg py-1'>
        <ArrowUpIcon className='text-muted-foreground size-3' />
        <MotionNumber value={request.votes} className='text-xs font-medium' />
      </span>
      <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <span className='truncate text-[13px] font-medium'>
          {request.title}
        </span>
        <span className='text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs'>
          <CompanyMark seed={request.company} size='sm' />
          <span className='truncate'>{askedBy}</span>
        </span>
      </span>
      <Swap swapKey={request.status} className='shrink-0'>
        <Chip color={status.color}>{status.label}</Chip>
      </Swap>
    </div>
  );
}

/**
 * The app the hero sells, drawn with the look of our blocks and playing on its own: a request
 * arrives at the top, a vote lands and one request ships. It is a picture, so nothing in it is
 * reachable; the first click on it ends the demonstration.
 */
export function ProductView() {
  const [requests, setRequests] = useState<FeatureRequest[]>(REQUESTS);
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = rowPresenceOf(shouldReduceMotion);

  function startOver() {
    setRequests(REQUESTS);
  }

  const steps: AutoplayStep[] = [
    { after: 1800, run: () => setRequests(withArrival) },
    {
      after: 1500,
      run: () => setRequests((current) => withVote(current, 'csv')),
    },
    {
      after: 1600,
      run: () =>
        setRequests((current) => withStatus(current, 'dark', 'shipped')),
    },
    {
      after: 1500,
      run: () => setRequests((current) => withVote(current, ARRIVING.id)),
    },
  ];
  const { ref } = useAutoplay(steps, {
    loopAfter: LOOP_AFTER_MS,
    onReset: startOver,
  });

  return (
    <div ref={ref} className='@container'>
      <div
        inert
        aria-hidden='true'
        className='bg-foreground/[0.025] flex gap-2 rounded-2xl p-2 select-none'
      >
        <Sidebar />
        <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex min-w-0 flex-1 flex-col rounded-[calc(var(--radius-2xl)-0.5rem)] shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.12)]'>
          <ListHeader count={requests.length} />
          <ul className='h-[19rem] overflow-hidden mask-b-from-75% px-2 pb-2'>
            <AnimatePresence initial={false}>
              {requests.map((request) => (
                <motion.li
                  key={request.id}
                  {...presence}
                  className='overflow-hidden'
                >
                  <RequestRow request={request} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      </div>
    </div>
  );
}
