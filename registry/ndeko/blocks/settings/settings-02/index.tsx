'use client';

import { useId, useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

import { ChannelEvents, Fold, SwappingLine } from './channel-sections';
import {
  CHANNELS,
  DELIVERIES,
  DELIVERY_LINE,
  INITIAL_NOTIFICATIONS,
  QUIET_TIMES,
  type Channel,
  type ChannelId,
  type Delivery,
  type NotificationValues,
  type SwitchKey,
} from './data';
import {
  ChoiceRow,
  ErrorPresence,
  SectionPanel,
  SectionTabs,
  SettingsPage,
  SettingsRow,
  SettingsSection,
  SwitchRow,
  UnsavedBar,
  describedByOf,
  hasChangeIn,
  useSettingsDraft,
  type NavItem,
} from './settings-kit';

const SAME_TIMES_ERROR = 'Pick two different times';

function channelOf(channelId: ChannelId): Channel {
  const channel = CHANNELS.find((candidate) => candidate.id === channelId);
  if (channel) {
    return channel;
  }
  return CHANNELS[0];
}

function quietErrorOf(values: NotificationValues) {
  const isSameTime = values.quietFrom === values.quietTo;
  const isBroken = values.quietHours && isSameTime;
  if (isBroken) {
    return SAME_TIMES_ERROR;
  }
  return null;
}

function quietLineOf(values: NotificationValues) {
  if (!values.quietHours) {
    return 'Push arrives at any hour';
  }
  return `Nothing buzzes from ${values.quietFrom} to ${values.quietTo}, mentions included`;
}

function shownErrorOf(isShown: boolean, error: string | null) {
  if (isShown) {
    return error;
  }
  return null;
}

function saveMessageOf(showsQuietError: boolean) {
  if (showsQuietError) {
    return 'Fix the quiet hours to save';
  }
  return undefined;
}

type TimeSelectProps = {
  label: string;
  value: string;
  describedBy?: string;
  isInvalid: boolean;
  onValueChange: (value: string) => void;
};

function TimeSelect({
  label,
  value,
  describedBy,
  isInvalid,
  onValueChange,
}: TimeSelectProps) {
  function changeValue(nextValue: unknown) {
    const option = QUIET_TIMES.find(
      (candidate) => candidate.value === nextValue
    );
    if (option) {
      onValueChange(option.value);
    }
  }

  return (
    <Select items={QUIET_TIMES} value={value} onValueChange={changeValue}>
      <SelectTrigger
        aria-label={label}
        aria-invalid={isInvalid}
        aria-describedby={describedBy}
        className='w-24 tabular-nums'
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align='end'>
        {QUIET_TIMES.map((time) => (
          <SelectItem key={time.value} value={time.value}>
            {time.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function Settings02() {
  const settings = useSettingsDraft<NotificationValues>(INITIAL_NOTIFICATIONS);
  const [channelId, setChannelId] = useState<ChannelId>('email');
  const [hasSwitched, setHasSwitched] = useState(false);
  const [isQuietErrorShown, setIsQuietErrorShown] = useState(false);
  const quietErrorId = useId();
  const draft = settings.draft;
  const email = channelOf('email');
  const push = channelOf('push');
  const desktop = channelOf('desktop');
  const quietError = quietErrorOf(draft);
  const hasQuietError = Boolean(quietError);
  const showsQuietError = isQuietErrorShown && hasQuietError;
  const shownQuietError = shownErrorOf(showsQuietError, quietError);
  const quietDescribedBy = describedByOf(showsQuietError, quietErrorId);
  const quietLine = quietLineOf(draft);
  const showsQuietTimes = draft.quietHours && draft.pushOn;
  const deliveryLine = DELIVERY_LINE[draft.emailDelivery];
  const saveMessage = saveMessageOf(showsQuietError);
  const navItems: NavItem<ChannelId>[] = CHANNELS.map((channel) => ({
    id: channel.id,
    label: channel.label,
    icon: channel.icon,
    hasChanges: hasChangeIn(settings.changedKeys, channel.keys),
  }));

  function openChannel(nextChannelId: ChannelId) {
    setChannelId(nextChannelId);
    setHasSwitched(true);
  }

  function switchValue(key: SwitchKey, checked: boolean) {
    settings.change(key, checked);
  }

  function changeDelivery(delivery: Delivery) {
    settings.change('emailDelivery', delivery);
  }

  function changeQuietHours(checked: boolean) {
    settings.change('quietHours', checked);
    setIsQuietErrorShown(false);
  }

  function changeQuietFrom(time: string) {
    settings.change('quietFrom', time);
    setIsQuietErrorShown(false);
  }

  function changeQuietTo(time: string) {
    settings.change('quietTo', time);
    setIsQuietErrorShown(false);
  }

  function changeSound(checked: boolean) {
    settings.change('desktopSound', checked);
  }

  function changePreview(checked: boolean) {
    settings.change('desktopPreview', checked);
  }

  function save() {
    if (hasQuietError) {
      setIsQuietErrorShown(true);
      openChannel('push');
      return;
    }
    settings.save();
  }

  function discard() {
    settings.discard();
    setIsQuietErrorShown(false);
  }

  const bar = (
    <UnsavedBar
      isShown={settings.isBarShown}
      status={settings.status}
      changeCount={settings.changedKeys.length}
      message={saveMessage}
      onDiscard={discard}
      onSave={save}
    />
  );

  return (
    <SettingsPage
      title='Notifications'
      line='Choose what reaches you on each channel. Mentions and tasks assigned to you always land in the app inbox.'
      bar={bar}
    >
      <SectionTabs
        label='Channels'
        items={navItems}
        value={channelId}
        onValueChange={openChannel}
      >
        <SectionPanel value='email' animatesIn={hasSwitched}>
          <ChannelEvents
            channel={email}
            values={draft}
            onSwitch={switchValue}
          />
          <SettingsSection
            title='Delivery'
            line='Group emails so your inbox stays readable'
          >
            <ChoiceRow
              label='Send emails'
              line={<SwappingLine text={deliveryLine} />}
              value={draft.emailDelivery}
              options={DELIVERIES}
              disabled={!draft.emailOn}
              onValueChange={changeDelivery}
            />
          </SettingsSection>
        </SectionPanel>
        <SectionPanel value='push' animatesIn={hasSwitched}>
          <ChannelEvents channel={push} values={draft} onSwitch={switchValue} />
          <SettingsSection
            title='Quiet hours'
            line='Your phone stays silent at night, in your time zone'
          >
            <div>
              <SwitchRow
                label='Quiet hours'
                line={<SwappingLine text={quietLine} />}
                checked={draft.quietHours}
                disabled={!draft.pushOn}
                onCheckedChange={changeQuietHours}
              />
              <Fold isOpen={showsQuietTimes}>
                <SettingsRow
                  label='Silent between'
                  line='Push waits and arrives together when it ends'
                >
                  <div className='flex items-center gap-2'>
                    <TimeSelect
                      label='Quiet hours start'
                      value={draft.quietFrom}
                      describedBy={quietDescribedBy}
                      isInvalid={showsQuietError}
                      onValueChange={changeQuietFrom}
                    />
                    <span className='text-muted-foreground text-xs'>and</span>
                    <TimeSelect
                      label='Quiet hours end'
                      value={draft.quietTo}
                      describedBy={quietDescribedBy}
                      isInvalid={showsQuietError}
                      onValueChange={changeQuietTo}
                    />
                  </div>
                  <ErrorPresence id={quietErrorId} error={shownQuietError} />
                </SettingsRow>
              </Fold>
            </div>
          </SettingsSection>
        </SectionPanel>
        <SectionPanel value='desktop' animatesIn={hasSwitched}>
          <ChannelEvents
            channel={desktop}
            values={draft}
            onSwitch={switchValue}
          />
          <SettingsSection
            title='On screen'
            line='How a desktop notification looks and sounds'
          >
            <SwitchRow
              label='Play a sound'
              line='A short chime, at most once a minute'
              checked={draft.desktopSound}
              disabled={!draft.desktopOn}
              onCheckedChange={changeSound}
            />
            <SwitchRow
              label='Show the message'
              line='Off shows only who wrote and on which task'
              checked={draft.desktopPreview}
              disabled={!draft.desktopOn}
              onCheckedChange={changePreview}
            />
          </SettingsSection>
        </SectionPanel>
      </SectionTabs>
    </SettingsPage>
  );
}
