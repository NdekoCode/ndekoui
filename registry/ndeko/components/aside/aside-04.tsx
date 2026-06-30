'use client';

import { useId, useState } from 'react';

import {
  InboxIcon,
  MailIcon,
  SmartphoneIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';
import { Switch } from '@/registry/ndeko/ui/switch';

import {
  AsideCloseButton,
  AsideDescription,
  AsidePreview,
  AsideTitle,
} from './_parts/aside-frame';

type Channel = 'inbox' | 'email' | 'mobile';

type ChannelSettings = Record<Channel, boolean>;

type EventSetting = { id: string; label: string };

type EventGroup = { id: string; label: string; events: EventSetting[] };

type Option = { value: string; label: string };

const CHANNELS: { id: Channel; label: string; icon: Icon }[] = [
  { id: 'inbox', label: 'Inbox', icon: InboxIcon },
  { id: 'email', label: 'E-mail', icon: MailIcon },
  { id: 'mobile', label: 'Mobile', icon: SmartphoneIcon },
];

const GROUPS: EventGroup[] = [
  {
    id: 'tasks',
    label: 'Tasks',
    events: [
      { id: 'assigned', label: 'Assigned to me' },
      { id: 'status', label: 'Status changed' },
      { id: 'due', label: 'Due tomorrow' },
    ],
  },
  {
    id: 'comments',
    label: 'Comments',
    events: [
      { id: 'mention', label: 'I am mentioned' },
      { id: 'reply', label: 'Replies to me' },
    ],
  },
  {
    id: 'time',
    label: 'Time',
    events: [
      { id: 'timer', label: 'Timer left running' },
      { id: 'approved', label: 'Timesheet approved' },
    ],
  },
];

const INITIAL_SETTINGS: Record<string, ChannelSettings> = {
  assigned: { inbox: true, email: true, mobile: true },
  status: { inbox: true, email: false, mobile: false },
  due: { inbox: true, email: true, mobile: false },
  mention: { inbox: true, email: true, mobile: true },
  reply: { inbox: true, email: false, mobile: true },
  timer: { inbox: false, email: false, mobile: false },
  approved: { inbox: false, email: false, mobile: false },
};

const ALL_ON: ChannelSettings = { inbox: true, email: true, mobile: true };

const ALL_OFF: ChannelSettings = { inbox: false, email: false, mobile: false };

const HOURS: Option[] = [
  { value: '18', label: '18:00' },
  { value: '19', label: '19:00' },
  { value: '20', label: '20:00' },
  { value: '21', label: '21:00' },
  { value: '07', label: '07:00' },
  { value: '08', label: '08:00' },
  { value: '09', label: '09:00' },
];

const DIGESTS: Option[] = [
  { value: 'daily', label: 'Every day at 09:00' },
  { value: 'weekly', label: 'Mondays at 09:00' },
  { value: 'never', label: 'No digest' },
];

function everyChannel(isOn: boolean) {
  if (isOn) {
    return ALL_ON;
  }
  return ALL_OFF;
}

function switchedOnCount(
  settings: Record<string, ChannelSettings>,
  group: EventGroup
) {
  let count = 0;
  for (const event of group.events) {
    for (const channel of CHANNELS) {
      if (settings[event.id][channel.id]) {
        count += 1;
      }
    }
  }
  return count;
}

function SmallSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  function changeValue(nextValue: unknown) {
    const option = options.find((candidate) => candidate.value === nextValue);
    if (option) {
      onChange(option.value);
    }
  }

  return (
    <Select items={options} value={value} onValueChange={changeValue}>
      <SelectTrigger size='sm' aria-label={label} className='w-auto'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align='end'>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function GroupRows({
  group,
  settings,
  onSet,
}: {
  group: EventGroup;
  settings: Record<string, ChannelSettings>;
  onSet: (eventIds: string[], channel: Channel | null, isOn: boolean) => void;
}) {
  const checkboxId = useId();
  const total = group.events.length * CHANNELS.length;
  const onCount = switchedOnCount(settings, group);
  const isAllOn = onCount === total;
  const isSomeOn = onCount > 0;
  const isMixed = isSomeOn && !isAllOn;
  const eventIds = group.events.map((event) => event.id);

  function toggleGroup() {
    onSet(eventIds, null, !isAllOn);
  }

  return (
    <tbody className='hairline-divide-y divide-border'>
      <tr>
        <th scope='rowgroup' colSpan={4} className='pt-4 pb-1.5 text-left'>
          <span className='flex items-center gap-2'>
            <Checkbox
              id={checkboxId}
              checked={isAllOn}
              indeterminate={isMixed}
              onCheckedChange={toggleGroup}
            />
            <label
              htmlFor={checkboxId}
              className='cursor-pointer text-xs font-medium'
            >
              {group.label}
            </label>
          </span>
        </th>
      </tr>
      {group.events.map((event) => (
        <tr key={event.id}>
          <th
            scope='row'
            className='py-2 pr-2 text-left text-[13px] font-normal'
          >
            {event.label}
          </th>
          {CHANNELS.map((channel) => {
            const isOn = settings[event.id][channel.id];

            function change(nextIsOn: boolean) {
              onSet([event.id], channel.id, nextIsOn);
            }

            return (
              <td key={channel.id} className='w-14 py-2 text-center'>
                <Switch
                  checked={isOn}
                  onCheckedChange={change}
                  aria-label={`${event.label} in ${channel.label}`}
                />
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
}

function NotificationSettings() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [isQuiet, setIsQuiet] = useState(true);
  const [quietFrom, setQuietFrom] = useState('20');
  const [quietTo, setQuietTo] = useState('08');
  const [digest, setDigest] = useState('daily');
  const quietSwitchId = useId();
  const quietLineId = useId();

  function setChannels(
    eventIds: string[],
    channel: Channel | null,
    isOn: boolean
  ) {
    setSettings((previous) => {
      const next = { ...previous };
      for (const eventId of eventIds) {
        if (channel === null) {
          next[eventId] = everyChannel(isOn);
          continue;
        }
        next[eventId] = { ...previous[eventId], [channel]: isOn };
      }
      return next;
    });
  }

  return (
    <div className='flex flex-col gap-6 p-5'>
      <div className='flex items-start gap-3'>
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <AsideTitle>Notifications</AsideTitle>
          <AsideDescription>
            Where each event reaches you, saved as you change it
          </AsideDescription>
        </div>
        <AsideCloseButton
          label='Close notification settings'
          className='-mt-1 -mr-2'
        />
      </div>
      <table className='w-full border-collapse'>
        <thead>
          <tr>
            <th scope='col' className='text-left'>
              <span className='sr-only'>Event</span>
            </th>
            {CHANNELS.map((channel) => {
              const ChannelGlyph = channel.icon;

              return (
                <th
                  key={channel.id}
                  scope='col'
                  className='text-muted-foreground w-14 pb-1 text-[11px] font-medium'
                >
                  <span className='flex flex-col items-center gap-1'>
                    <ChannelGlyph className='size-4' />
                    {channel.label}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        {GROUPS.map((group) => (
          <GroupRows
            key={group.id}
            group={group}
            settings={settings}
            onSet={setChannels}
          />
        ))}
      </table>
      <section aria-label='Quiet hours' className='flex flex-col'>
        <div className='flex items-start gap-3'>
          <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
            <label htmlFor={quietSwitchId} className='text-sm font-medium'>
              Quiet hours
            </label>
            <p id={quietLineId} className='text-muted-foreground text-xs'>
              Mobile stays silent, the inbox keeps everything
            </p>
          </div>
          <Switch
            id={quietSwitchId}
            checked={isQuiet}
            onCheckedChange={setIsQuiet}
            aria-describedby={quietLineId}
          />
        </div>
        <AnimatedSize>
          {isQuiet && (
            <div className='flex items-center gap-2 pt-3 text-[13px]'>
              <span className='text-muted-foreground'>From</span>
              <SmallSelect
                label='Quiet hours start'
                value={quietFrom}
                options={HOURS}
                onChange={setQuietFrom}
              />
              <span className='text-muted-foreground'>to</span>
              <SmallSelect
                label='Quiet hours end'
                value={quietTo}
                options={HOURS}
                onChange={setQuietTo}
              />
            </div>
          )}
        </AnimatedSize>
      </section>
      <section
        aria-label='Digest'
        className='flex items-center justify-between gap-3'
      >
        <div className='flex min-w-0 flex-col gap-0.5'>
          <h3 className='text-sm font-medium'>Digest</h3>
          <p className='text-muted-foreground text-xs'>
            What you missed, in one e-mail
          </p>
        </div>
        <SmallSelect
          label='Digest frequency'
          value={digest}
          options={DIGESTS}
          onChange={setDigest}
        />
      </section>
    </div>
  );
}

export default function Aside04() {
  return (
    <AsidePreview triggerLabel='Open notification settings'>
      <NotificationSettings />
    </AsidePreview>
  );
}
