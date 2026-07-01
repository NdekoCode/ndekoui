'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId, useState } from 'react';

import { CircleIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Input } from '@/registry/ndeko/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

import {
  CURRENT_USER_ID,
  PEOPLE,
  ROLE_OPTIONS,
  TIME_ZONES,
  VISIBILITY_OPTIONS,
  WEEK_STARTS,
  type MemberRole,
  type PropertyValue,
  type SettingsPageId,
  type Visibility,
} from './data';
import {
  ChoiceCards,
  DangerRow,
  InlineTextRow,
  SETTINGS_SURFACE,
  SelectRow,
  SettingsPage,
  SettingsSection,
  SwitchRow,
  describedByOf,
} from './settings-kit';
import { PersonAvatar } from './sidebar-parts';

export type SettingsState = {
  fullName: string;
  email: string;
  title: string;
  timeZone: string;
  weekStart: string;
  remindToTrack: boolean;
  stopWhenIdle: boolean;
  showSeconds: boolean;
  mailAssignments: boolean;
  mailMentions: boolean;
  mailWeeklySummary: boolean;
  appComments: boolean;
  appStatusChanges: boolean;
  teamName: string;
  teamKey: string;
  visibility: Visibility;
  roles: Record<string, MemberRole>;
  statuses: PropertyValue[];
  labels: PropertyValue[];
};

type SettingsPatch = Partial<SettingsState>;

type PageProps = {
  settings: SettingsState;
  onChange: (patch: SettingsPatch) => void;
};

const NEW_VALUE_COLORS = [
  'var(--primary)',
  'var(--info)',
  'var(--success)',
  'var(--warning)',
  'var(--destructive)',
];

const PRESENCE_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const PRESENCE_OUT: Transition = { duration: 0.14, ease: [0.23, 1, 0.32, 1] };

const ROW_PRESENCE: Variants = {
  hidden: { height: 0, opacity: 0, transition: PRESENCE_OUT },
  shown: { height: 'auto', opacity: 1, transition: PRESENCE_IN },
};

const ROW_FADE: Variants = {
  hidden: { opacity: 0, transition: PRESENCE_OUT },
  shown: { opacity: 1, transition: PRESENCE_IN },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TEAM_KEY_PATTERN = /^[A-Z]{2,5}$/;

function rowVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return ROW_FADE;
  }
  return ROW_PRESENCE;
}

function taskCountLabel(count: number) {
  if (count === 1) {
    return '1 task';
  }
  return `${count} tasks`;
}

function validateName(draft: string) {
  if (draft.length === 0) {
    return 'Enter a name';
  }
  return null;
}

function validateEmail(draft: string) {
  const isEmail = EMAIL_PATTERN.test(draft);
  if (!isEmail) {
    return 'Enter an address like name@company.com';
  }
  return null;
}

function validateTeamKey(draft: string) {
  const isKey = TEAM_KEY_PATTERN.test(draft);
  if (!isKey) {
    return 'Use 2 to 5 capital letters, such as LAT';
  }
  return null;
}

function isVisibility(value: string): value is Visibility {
  const isPublic = value === 'public';
  const isPrivate = value === 'private';
  return isPublic || isPrivate;
}

function isMemberRole(value: unknown): value is MemberRole {
  return ROLE_OPTIONS.some((option) => option.value === value);
}

function ProfilePage({ settings, onChange }: PageProps) {
  return (
    <SettingsPage
      title='Profile'
      line='How your teammates see you across Lattice Studio'
    >
      <SettingsSection title='Identity'>
        <InlineTextRow
          label='Full name'
          line='Shown on tasks, comments and timesheets'
          value={settings.fullName}
          validate={validateName}
          onSave={(fullName) => onChange({ fullName })}
        />
        <InlineTextRow
          label='Title'
          line='A few words under your name in member lists'
          value={settings.title}
          validate={validateName}
          onSave={(title) => onChange({ title })}
        />
        <InlineTextRow
          label='E-mail'
          line='Where invitations and summaries are sent'
          value={settings.email}
          inputType='email'
          validate={validateEmail}
          onSave={(email) => onChange({ email })}
        />
      </SettingsSection>
      <SettingsSection title='Region'>
        <SelectRow
          label='Time zone'
          line='Days and timesheets start at midnight here'
          value={settings.timeZone}
          options={TIME_ZONES}
          onValueChange={(timeZone) => onChange({ timeZone })}
        />
      </SettingsSection>
      <SettingsSection title='Danger zone'>
        <DangerRow
          label='Delete account'
          line='Removes your profile, your time entries and your access to every workspace'
          dialogTitle={`Delete the account of ${settings.fullName}?`}
          actionLabel='Delete account'
          objectName={settings.fullName}
          consequences={[
            'You leave Lattice Studio and its 1 team',
            'Your 5 assigned tasks become unassigned',
            'Time you logged stays in the team reports, without your name',
          ]}
          scheduledLine='Deletion scheduled: your account closes in 14 days unless you cancel'
        />
      </SettingsSection>
    </SettingsPage>
  );
}

function PreferencesPage({ settings, onChange }: PageProps) {
  return (
    <SettingsPage
      title='Preferences'
      line='Choices that only change the app for you'
    >
      <SettingsSection title='Calendar'>
        <SelectRow
          label='Start of the week'
          line='Used by timesheets, cycles and date pickers'
          value={settings.weekStart}
          options={WEEK_STARTS}
          onValueChange={(weekStart) => onChange({ weekStart })}
        />
      </SettingsSection>
      <SettingsSection title='Time tracking'>
        <SwitchRow
          label='Remind me to track time'
          line='A notice when you open a task in progress without a timer'
          checked={settings.remindToTrack}
          onCheckedChange={(remindToTrack) => onChange({ remindToTrack })}
        />
        <SwitchRow
          label='Pause the timer when I am idle'
          line='After 10 minutes without keyboard or pointer activity'
          checked={settings.stopWhenIdle}
          onCheckedChange={(stopWhenIdle) => onChange({ stopWhenIdle })}
        />
        <SwitchRow
          label='Show seconds'
          line='In the timer of the top bar and on task cards'
          checked={settings.showSeconds}
          onCheckedChange={(showSeconds) => onChange({ showSeconds })}
        />
      </SettingsSection>
    </SettingsPage>
  );
}

function NotificationsPage({ settings, onChange }: PageProps) {
  return (
    <SettingsPage
      title='Notifications'
      line='What reaches your inbox and your e-mail'
    >
      <SettingsSection title='E-mail' line={`Sent to ${settings.email}.`}>
        <SwitchRow
          label='Assignments'
          line='When someone assigns you a task'
          checked={settings.mailAssignments}
          onCheckedChange={(mailAssignments) => onChange({ mailAssignments })}
        />
        <SwitchRow
          label='Mentions'
          line='When someone writes your name in a comment'
          checked={settings.mailMentions}
          onCheckedChange={(mailMentions) => onChange({ mailMentions })}
        />
        <SwitchRow
          label='Weekly summary'
          line='Your hours and finished tasks, every Monday morning'
          checked={settings.mailWeeklySummary}
          onCheckedChange={(mailWeeklySummary) =>
            onChange({ mailWeeklySummary })
          }
        />
      </SettingsSection>
      <SettingsSection title='Inbox'>
        <SwitchRow
          label='Comments on my tasks'
          line='Every new comment on a task you own'
          checked={settings.appComments}
          onCheckedChange={(appComments) => onChange({ appComments })}
        />
        <SwitchRow
          label='Status changes'
          line='When a task you follow moves to another status'
          checked={settings.appStatusChanges}
          onCheckedChange={(appStatusChanges) => onChange({ appStatusChanges })}
        />
      </SettingsSection>
    </SettingsPage>
  );
}

function TeamGeneralPage({ settings, onChange }: PageProps) {
  function changeVisibility(value: string) {
    if (isVisibility(value)) {
      onChange({ visibility: value });
    }
  }

  return (
    <SettingsPage
      title='General'
      line={`The name, the key and the visibility of the ${settings.teamName} team`}
    >
      <SettingsSection title='Team'>
        <InlineTextRow
          label='Name'
          line='Shown in the sidebar and in every switcher'
          value={settings.teamName}
          validate={validateName}
          onSave={(teamName) => onChange({ teamName })}
        />
        <InlineTextRow
          label='Key'
          line='The prefix of task numbers, such as LAT-142'
          value={settings.teamKey}
          validate={validateTeamKey}
          onSave={(teamKey) => onChange({ teamKey })}
        />
      </SettingsSection>
      <section className='flex flex-col gap-3'>
        <div className='flex flex-col gap-0.5'>
          <h2 className='text-sm font-medium'>Visibility</h2>
          <p className='text-muted-foreground text-xs'>
            Changes what people outside the team can see
          </p>
        </div>
        <ChoiceCards
          label='Visibility'
          value={settings.visibility}
          options={VISIBILITY_OPTIONS}
          onValueChange={changeVisibility}
        />
      </section>
      <SettingsSection title='Danger zone'>
        <DangerRow
          label='Delete team'
          line='Removes the team, its board and its cycles for every member'
          dialogTitle={`Delete the ${settings.teamName} team?`}
          actionLabel='Delete team'
          objectName={settings.teamName}
          consequences={[
            'The 6 members lose access to the team’s tasks',
            'The 9 tasks of the team move to the workspace archive',
            'Time already logged stays in the workspace reports',
          ]}
          scheduledLine='Deletion scheduled: the team closes in 14 days unless you cancel'
        />
      </SettingsSection>
    </SettingsPage>
  );
}

function roleLineOf(isCurrentUser: boolean, title: string) {
  if (isCurrentUser) {
    return 'You cannot change your own role';
  }
  return title;
}

function TeamMembersPage({ settings, onChange }: PageProps) {
  function changeRole(personId: string, role: unknown) {
    if (!isMemberRole(role)) {
      return;
    }
    const roles = { ...settings.roles, [personId]: role };
    onChange({ roles });
  }

  return (
    <SettingsPage
      title='Members'
      line='Managers change the team’s settings and viewers read without editing'
    >
      <SettingsSection title={`${PEOPLE.length} members`}>
        {PEOPLE.map((person) => {
          const isCurrentUser = person.id === CURRENT_USER_ID;
          const roleLine = roleLineOf(isCurrentUser, person.role);

          function selectRole(role: unknown) {
            changeRole(person.id, role);
          }

          return (
            <div
              key={person.id}
              className='flex min-h-14 items-center gap-3 px-4 py-2.5'
            >
              <PersonAvatar person={person} className='size-8' />
              <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                <p className='flex items-center gap-2 text-[13px] font-medium'>
                  <span className='truncate'>{person.name}</span>
                  {isCurrentUser && (
                    <Badge
                      variant='secondary'
                      className='text-muted-foreground'
                    >
                      You
                    </Badge>
                  )}
                </p>
                <p className='text-muted-foreground truncate text-xs'>
                  {roleLine}
                </p>
              </div>
              <Select
                items={ROLE_OPTIONS}
                value={settings.roles[person.id]}
                onValueChange={selectRole}
                disabled={isCurrentUser}
              >
                <SelectTrigger
                  size='sm'
                  aria-label={`Role of ${person.name}`}
                  className='w-28'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </SettingsSection>
    </SettingsPage>
  );
}

function ValueTile({
  value,
  kind,
}: {
  value: PropertyValue;
  kind: 'status' | 'label';
}) {
  const tileStyle = { '--chip': value.color } as React.CSSProperties;
  if (kind === 'status') {
    return (
      <span
        style={tileStyle}
        className='chip-3d flex size-6 shrink-0 items-center justify-center rounded-md'
      >
        <CircleIcon className='size-3.5' strokeWidth={2.25} />
      </span>
    );
  }
  return <Chip color={value.color}>{value.name}</Chip>;
}

type PropertyListProps = {
  kind: 'status' | 'label';
  values: PropertyValue[];
  onAdd: (name: string) => void;
};

function PropertyList({ kind, values, onAdd }: PropertyListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const rowVariants = rowVariantsOf(shouldReduceMotion);
  const errorId = useId();
  const hasError = Boolean(error);
  const describedBy = describedByOf(hasError, errorId);

  function startAdding() {
    setDraft('');
    setError(null);
    setIsAdding(true);
  }

  function stopAdding() {
    setIsAdding(false);
    setError(null);
  }

  function changeDraft(event: React.ChangeEvent<HTMLInputElement>) {
    setDraft(event.target.value);
    setError(null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      stopAdding();
    }
  }

  function addValue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draft.trim();
    if (name.length === 0) {
      setError(`Enter the name of the ${kind}.`);
      return;
    }
    const lowerName = name.toLowerCase();
    const isTaken = values.some(
      (value) => value.name.toLowerCase() === lowerName
    );
    if (isTaken) {
      setError(`A ${kind} named ${name} already exists`);
      return;
    }
    onAdd(name);
    setDraft('');
  }

  return (
    <div className='flex flex-col gap-2'>
      <ul className={SETTINGS_SURFACE}>
        <AnimatePresence initial={false}>
          {values.map((value) => (
            <motion.li
              key={value.id}
              variants={rowVariants}
              initial='hidden'
              animate='shown'
              exit='hidden'
              className='overflow-hidden'
            >
              <div className='flex h-12 items-center gap-3 px-4'>
                <ValueTile value={value} kind={kind} />
                {kind === 'status' && (
                  <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
                    {value.name}
                  </span>
                )}
                {kind === 'label' && <span className='flex-1' />}
                <span className='text-muted-foreground text-xs tabular-nums'>
                  {taskCountLabel(value.taskCount)}
                </span>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {isAdding && (
        <form onSubmit={addValue} className='flex flex-col gap-1.5'>
          <div className='flex items-center gap-2'>
            <Input
              autoFocus
              value={draft}
              placeholder={`Name of the ${kind}`}
              aria-label={`Name of the new ${kind}`}
              aria-invalid={hasError}
              aria-describedby={describedBy}
              onChange={changeDraft}
              onKeyDown={handleKeyDown}
            />
            <Button type='button' variant='ghost' onClick={stopAdding}>
              Done
            </Button>
            <Button type='submit'>Add</Button>
          </div>
          {hasError && (
            <p id={errorId} className='text-destructive-ink text-xs'>
              {error}
            </p>
          )}
        </form>
      )}
      {!isAdding && (
        <button
          type='button'
          onClick={startAdding}
          className='hairline-border text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 border-foreground/20 hover:border-foreground/35 flex h-11 cursor-pointer items-center gap-2 rounded-xl border-dashed px-4 text-[13px] transition-colors duration-150 outline-none focus-visible:ring-[3px]'
        >
          <PlusIcon className='size-4' />
          {`Add ${kind}`}
        </button>
      )}
    </div>
  );
}

function newValueOf(name: string, values: PropertyValue[]): PropertyValue {
  const colorIndex = values.length % NEW_VALUE_COLORS.length;
  return {
    id: `${name.toLowerCase().replace(/\s+/g, '-')}-${values.length}`,
    name,
    color: NEW_VALUE_COLORS[colorIndex],
    taskCount: 0,
  };
}

function StatusesPage({ settings, onChange }: PageProps) {
  function addStatus(name: string) {
    const added = newValueOf(name, settings.statuses);
    onChange({ statuses: [...settings.statuses, added] });
  }

  return (
    <SettingsPage
      title='Statuses'
      line='The steps a task goes through, in the order of the board'
    >
      <PropertyList
        kind='status'
        values={settings.statuses}
        onAdd={addStatus}
      />
    </SettingsPage>
  );
}

function LabelsPage({ settings, onChange }: PageProps) {
  function addLabel(name: string) {
    const added = newValueOf(name, settings.labels);
    onChange({ labels: [...settings.labels, added] });
  }

  return (
    <SettingsPage
      title='Labels'
      line='Tags that group tasks across projects and statuses'
    >
      <PropertyList kind='label' values={settings.labels} onAdd={addLabel} />
    </SettingsPage>
  );
}

const PAGES: Record<SettingsPageId, (props: PageProps) => React.ReactNode> = {
  'settings-profile': ProfilePage,
  'settings-preferences': PreferencesPage,
  'settings-notifications': NotificationsPage,
  'settings-team-general': TeamGeneralPage,
  'settings-team-members': TeamMembersPage,
  'settings-statuses': StatusesPage,
  'settings-labels': LabelsPage,
};

export function SettingsView({
  pageId,
  settings,
  onChange,
}: PageProps & { pageId: SettingsPageId }) {
  const Page = PAGES[pageId];
  return <Page settings={settings} onChange={onChange} />;
}
