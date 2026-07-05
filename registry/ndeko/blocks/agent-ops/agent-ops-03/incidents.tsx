'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { Chip } from '@/registry/ndeko/ui/chip';

import {
  LIVE_INCIDENT,
  PAST_INCIDENTS,
  serviceOf,
  type Incident,
  type IncidentUpdate,
  type UpdateKind,
} from './data';

const KIND_WORD: Record<UpdateKind, string> = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
};

const KIND_COLOR: Record<UpdateKind, string> = {
  investigating: 'var(--warning)',
  identified: 'var(--warning)',
  monitoring: 'var(--info)',
  resolved: 'var(--success)',
};

type UpdateRowProps = {
  update: IncidentUpdate;
  isLast: boolean;
};

function UpdateRow({ update, isLast }: UpdateRowProps) {
  return (
    <div className='relative flex gap-3 pb-3'>
      {!isLast && (
        <span
          aria-hidden='true'
          className='bg-border absolute top-4 bottom-0 left-1 w-px -translate-x-1/2'
        />
      )}
      <span
        aria-hidden='true'
        className='bg-foreground/25 mt-1.5 size-2 shrink-0 rounded-full'
      />
      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        <p className='flex flex-wrap items-center gap-x-2 gap-y-1'>
          <Chip color={KIND_COLOR[update.kind]}>{KIND_WORD[update.kind]}</Chip>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {update.time} UTC
          </span>
        </p>
        <p className='text-[13px] leading-relaxed'>{update.text}</p>
      </div>
    </div>
  );
}

type IncidentCardProps = {
  incident: Incident;
  /** How many of its updates are out. The newest sits on top. */
  updatesOut: number;
};

function IncidentCard({ incident, updatesOut }: IncidentCardProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const service = serviceOf(incident.serviceId);
  const shown = incident.updates.slice(0, updatesOut);
  const newestFirst = [...shown].reverse();
  const oldest = shown[0];

  return (
    <div className='flex flex-col gap-3 pb-5'>
      <div className='flex flex-col gap-0.5'>
        <h3 className='text-[13px] font-medium text-pretty'>
          {incident.title}
        </h3>
        <p className='text-muted-foreground text-xs'>
          {service.name} · {incident.date}
        </p>
      </div>
      <ol className='flex flex-col'>
        <AnimatePresence initial={false}>
          {newestFirst.map((update) => (
            <motion.li
              key={update.kind}
              className='overflow-hidden'
              {...rowPresence}
            >
              <UpdateRow update={update} isLast={update === oldest} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}

type IncidentsProps = {
  /** How many updates of the live incident are out; none hides it. */
  liveUpdatesOut: number;
};

export function Incidents({ liveUpdatesOut }: IncidentsProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const hasLive = liveUpdatesOut > 0;

  return (
    <section aria-label='Incidents' className='flex flex-col gap-3'>
      <h2 className='text-sm font-medium'>Incidents</h2>
      <ul className='flex flex-col'>
        <AnimatePresence initial={false}>
          {hasLive && (
            <motion.li
              key={LIVE_INCIDENT.id}
              className='overflow-hidden'
              {...rowPresence}
            >
              <IncidentCard
                incident={LIVE_INCIDENT}
                updatesOut={liveUpdatesOut}
              />
            </motion.li>
          )}
        </AnimatePresence>
        {PAST_INCIDENTS.map((incident) => (
          <li key={incident.id}>
            <IncidentCard
              incident={incident}
              updatesOut={incident.updates.length}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
