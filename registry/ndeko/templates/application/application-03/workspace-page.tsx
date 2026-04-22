'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId, useState } from 'react';

import {
  SettingsIcon,
  TriangleAlertIcon,
  UsersIcon,
} from '@/registry/ndeko/lib/icons';

import { DangerZone } from './danger-zone';
import {
  WORKSPACE_FIELD_SECTION,
  INVITE_POLICIES,
  ROLE_OPTIONS,
  WORKSPACE_FACTS,
  WORKSPACE_SECTION_KEYS,
  TIME_ZONES,
  WORKSPACE_HOST,
  type Role,
  type WorkspaceSectionId,
  type WorkspaceField,
  type WorkspaceValues,
} from './data';
import { RoleChoice } from './role-choice';
import {
  SETTINGS_SURFACE_BASE,
  SectionPanel,
  SectionTabs,
  SelectRow,
  SettingsPage,
  SettingsRow,
  SettingsSection,
  SwitchRow,
  TextRow,
  UnsavedBar,
  hasChangeIn,
  useSettingsDraft,
  type NavItem,
} from './settings-kit';

type WorkspaceErrors = Partial<Record<WorkspaceField, string>>;

const SECTIONS = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'members', label: 'Members', icon: UsersIcon },
  { id: 'danger', label: 'Danger zone', icon: TriangleAlertIcon },
] as const;

const FIELD_ORDER: WorkspaceField[] = ['name', 'slug', 'allowedDomain'];

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const DOMAIN_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

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

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function errorsOf(values: WorkspaceValues): WorkspaceErrors {
  const errors: WorkspaceErrors = {};
  const name = values.name.trim();
  const domain = values.allowedDomain.trim();
  const hasDomain = domain.length > 0;
  const isSlugValid = SLUG_PATTERN.test(values.slug);
  const isDomainValid = DOMAIN_PATTERN.test(domain);
  const isDomainMalformed = hasDomain && !isDomainValid;
  if (name.length === 0) {
    errors.name = 'Give the workspace a name';
  }
  if (!isSlugValid) {
    errors.slug = 'Use lowercase letters and digits, joined by single hyphens';
  }
  if (isDomainMalformed) {
    errors.allowedDomain = 'Enter a domain like lattice.example, without the @';
  }
  return errors;
}

function firstErrorFieldOf(errors: WorkspaceErrors) {
  const field = FIELD_ORDER.find((candidate) => Boolean(errors[candidate]));
  if (field) {
    return field;
  }
  return null;
}

function withoutError(errors: WorkspaceErrors, field: WorkspaceField) {
  if (!errors[field]) {
    return errors;
  }
  const next = { ...errors };
  delete next[field];
  return next;
}

function fixMessageOf(errors: WorkspaceErrors) {
  const messages = Object.values(errors);
  const count = messages.filter(Boolean).length;
  if (count === 0) {
    return undefined;
  }
  if (count === 1) {
    return 'Fix 1 field to save';
  }
  return `Fix ${count} fields to save`;
}

function initialOf(name: string) {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return '?';
  }
  const [firstCharacter] = Array.from(trimmed);
  return firstCharacter.toUpperCase();
}

function slugLineOf(slug: string) {
  const address = `${WORKSPACE_HOST}${slug}`;
  return `${address}, old links redirect for 30 days`;
}

function domainLineOf(domain: string) {
  const trimmed = domain.trim();
  if (trimmed.length === 0) {
    return 'Empty: people join only with an invitation';
  }
  return `Anyone with an @${trimmed} address can join`;
}

function fieldIdOf(field: WorkspaceField) {
  return `workspace-${field}`;
}

function focusField(field: WorkspaceField) {
  const fieldId = fieldIdOf(field);
  window.requestAnimationFrame(() => {
    document.getElementById(fieldId)?.focus();
  });
}

/** The workspace has no logo, so its tile carries the initial; the letter swaps as the name changes. */
function WorkspaceTile({ name }: { name: string }) {
  const shouldReduceMotion = useReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);
  const initial = initialOf(name);
  const tileStyle = { '--gem': 'var(--primary)' } as React.CSSProperties;

  return (
    <span
      aria-hidden='true'
      style={tileStyle}
      className='gem-plate flex size-10 shrink-0 items-center justify-center rounded-lg text-base font-semibold'
    >
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={initial}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
        >
          {initial}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

type WorkspacePageProps = {
  values: WorkspaceValues;
  onSaved: (values: WorkspaceValues) => void;
};

export function WorkspacePage({ values, onSaved }: WorkspacePageProps) {
  const settings = useSettingsDraft<WorkspaceValues>(values, onSaved);
  const [section, setSection] = useState<WorkspaceSectionId>('general');
  const [hasSwitched, setHasSwitched] = useState(false);
  const [shownErrors, setShownErrors] = useState<WorkspaceErrors>({});
  const roleHeadingId = useId();
  const draft = settings.draft;
  const savedName = settings.savedValues.name;
  const fixMessage = fixMessageOf(shownErrors);
  const slugLine = slugLineOf(draft.slug);
  const domainLine = domainLineOf(draft.allowedDomain);
  const navItems: NavItem<WorkspaceSectionId>[] = SECTIONS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    hasChanges: hasChangeIn(
      settings.changedKeys,
      WORKSPACE_SECTION_KEYS[item.id]
    ),
  }));

  function openSection(nextSection: WorkspaceSectionId) {
    setSection(nextSection);
    setHasSwitched(true);
  }

  function changeField<Field extends WorkspaceField>(
    field: Field,
    value: WorkspaceValues[Field]
  ) {
    settings.change(field, value);
    setShownErrors((previous) => withoutError(previous, field));
  }

  function save() {
    const errors = errorsOf(draft);
    const firstField = firstErrorFieldOf(errors);
    setShownErrors(errors);
    if (!firstField) {
      settings.save();
      return;
    }
    const fieldSection = WORKSPACE_FIELD_SECTION[firstField];
    if (fieldSection !== section) {
      openSection(fieldSection);
    }
    focusField(firstField);
  }

  function discard() {
    settings.discard();
    setShownErrors({});
  }

  function changeName(name: string) {
    changeField('name', name);
  }

  function changeSlug(slug: string) {
    const lowered = slug.toLowerCase();
    changeField('slug', lowered);
  }

  function changeTimeZone(timeZone: string) {
    changeField('timeZone', timeZone);
  }

  function changeRole(role: Role) {
    changeField('defaultRole', role);
  }

  function changeInvitePolicy(policy: string) {
    const option = INVITE_POLICIES.find(
      (candidate) => candidate.value === policy
    );
    if (option) {
      changeField('invitePolicy', option.value);
    }
  }

  function changeApproveJoins(checked: boolean) {
    changeField('approveJoins', checked);
  }

  function changeDomain(domain: string) {
    const lowered = domain.toLowerCase();
    changeField('allowedDomain', lowered);
  }

  const bar = (
    <UnsavedBar
      isShown={settings.isBarShown}
      status={settings.status}
      changeCount={settings.changedKeys.length}
      message={fixMessage}
      onDiscard={discard}
      onSave={save}
    />
  );

  return (
    <SettingsPage
      title='Workspace'
      line={`The name, the address and who can join ${settings.savedValues.name}. Changes here apply to all ${WORKSPACE_FACTS.members} members.`}
      bar={bar}
    >
      <SectionTabs
        label='Workspace sections'
        items={navItems}
        value={section}
        onValueChange={openSection}
      >
        <SectionPanel value='general' animatesIn={hasSwitched}>
          <SettingsSection
            title='General'
            line='How the workspace shows in the sidebar, links and emails'
          >
            <SettingsRow
              label='Workspace tile'
              line='No logo yet, so the tile shows the first letter of the name'
            >
              <WorkspaceTile name={draft.name} />
            </SettingsRow>
            <TextRow
              inputId={fieldIdOf('name')}
              label='Name'
              line='Shown in the sidebar and in invitations'
              value={draft.name}
              error={shownErrors.name}
              autoComplete='organization'
              maxLength={48}
              onValueChange={changeName}
            />
            <TextRow
              inputId={fieldIdOf('slug')}
              label='Address'
              line={slugLine}
              value={draft.slug}
              error={shownErrors.slug}
              autoComplete='off'
              maxLength={40}
              onValueChange={changeSlug}
            />
            <SelectRow
              label='Time zone'
              line='Days in reports and timesheets close at midnight here'
              value={draft.timeZone}
              options={TIME_ZONES}
              onValueChange={changeTimeZone}
            />
          </SettingsSection>
        </SectionPanel>
        <SectionPanel value='members' animatesIn={hasSwitched}>
          <section
            aria-labelledby={roleHeadingId}
            className='flex flex-col gap-3'
          >
            <div className='flex flex-col gap-0.5'>
              <h2 id={roleHeadingId} className='text-sm font-medium'>
                Default role for new members
              </h2>
              <p className='text-muted-foreground text-xs'>
                Given to everyone who joins from now on; people already in keep
                their role
              </p>
            </div>
            <div className={SETTINGS_SURFACE_BASE}>
              <RoleChoice
                labelledBy={roleHeadingId}
                options={ROLE_OPTIONS}
                value={draft.defaultRole}
                onValueChange={changeRole}
              />
            </div>
          </section>
          <SettingsSection
            title='Joining'
            line='Invitations and the people who can send them'
          >
            <SelectRow
              label='Who can invite'
              line='Invitations last 7 days'
              value={draft.invitePolicy}
              options={INVITE_POLICIES}
              onValueChange={changeInvitePolicy}
            />
            <SwitchRow
              label='Approve new members'
              line='People who join with a link wait until an admin lets them in'
              checked={draft.approveJoins}
              onCheckedChange={changeApproveJoins}
            />
            <TextRow
              inputId={fieldIdOf('allowedDomain')}
              label='Allowed email domain'
              line={domainLine}
              placeholder='company.com'
              value={draft.allowedDomain}
              error={shownErrors.allowedDomain}
              autoComplete='off'
              maxLength={64}
              onValueChange={changeDomain}
            />
          </SettingsSection>
        </SectionPanel>
        <SectionPanel value='danger' animatesIn={hasSwitched}>
          <SettingsSection
            title='Danger zone'
            line='These apply at once and do not wait for Save'
          >
            <DangerZone workspaceName={savedName} />
          </SettingsSection>
        </SectionPanel>
      </SectionTabs>
    </SettingsPage>
  );
}
