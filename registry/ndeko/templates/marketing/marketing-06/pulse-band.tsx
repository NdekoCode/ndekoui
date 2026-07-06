import {
  RunPulse,
  type PulseAgent,
  type PulseLead,
  type PulseTool,
} from '@/registry/ndeko/components/illustration/illustration-03';
import { seriesColorOf, type SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import { NetworkIcon } from '@/registry/ndeko/lib/icons';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import { ANCHORS } from './data';
import { SectionFrame, SectionHeader } from './section-frame';

const LEAD: PulseLead = { name: 'Planner', series: 5 };

const TOOLS: PulseTool[] = [
  { id: 'stripe', name: 'Stripe', brand: 'stripe' },
  { id: 'quickbooks', name: 'QuickBooks', brand: 'quickbooks' },
  { id: 'xero', name: 'Xero', brand: 'xero' },
  { id: 'gmail', name: 'Gmail', brand: 'gmail' },
  { id: 'gusto', name: 'Gusto', brand: 'gusto' },
];

const AGENTS: PulseAgent[] = [
  {
    id: 'reconciler',
    name: 'Reconciler',
    series: 1,
    toolIds: ['stripe', 'quickbooks'],
  },
  {
    id: 'collector',
    name: 'Collector',
    series: 2,
    toolIds: ['gmail', 'xero'],
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    series: 3,
    toolIds: ['gusto', 'quickbooks'],
  },
];

type Duty = {
  name: string;
  series: SeriesSlot;
  text: string;
};

const DUTIES: Duty[] = [
  {
    name: 'Reconciler',
    series: 1,
    text: 'Matches every bank line to an invoice or a payout.',
  },
  {
    name: 'Collector',
    series: 2,
    text: 'Asks by email for the receipts and invoices that are missing.',
  },
  {
    name: 'Reviewer',
    series: 3,
    text: 'Reads each drafted entry against payroll and the ledger before you do.',
  },
];

export function PulseBand() {
  return (
    <SectionFrame id={ANCHORS.pulse}>
      <div className='grid items-center gap-10 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] @3xl:gap-16'>
        <div className='flex flex-col gap-8'>
          <SectionHeader
            icon={NetworkIcon}
            label='How a close is split'
            title='One planner, three agents, the tools you already pay for'
            lead='The planner reads the checklist of the close and hands each part to an agent. Each agent calls only the tools it was given, and every call is written down.'
          />
          <ul className='flex flex-col gap-3'>
            {DUTIES.map((duty) => (
              <li key={duty.name} className='flex items-start gap-3'>
                <MeshTile
                  seed={duty.name}
                  color={seriesColorOf(duty.series)}
                  size='lg'
                />
                <p className='text-[13px] leading-5 text-pretty'>
                  <span className='font-medium'>{duty.name}</span>{' '}
                  <span className='text-muted-foreground'>{duty.text}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div className='bg-foreground/[0.03] flex items-center justify-center rounded-2xl p-6 @2xl:p-8'>
          <RunPulse lead={LEAD} agents={AGENTS} tools={TOOLS} />
        </div>
      </div>
    </SectionFrame>
  );
}
