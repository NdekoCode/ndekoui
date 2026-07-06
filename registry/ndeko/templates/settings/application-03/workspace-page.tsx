'use client';

import { useId, useState } from 'react';

import {
  SettingsIcon,
  TriangleAlertIcon,
  UsersIcon,
} from '@/registry/ndeko/lib/icons';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';

import { DangerZone } from './danger-zone';
import {
  INVITE_POLICIES,
  type Role,
  ROLE_OPTIONS,
  TIME_ZONES,
  WORKSPACE_FACTS,
  WORKSPACE_FIELD_SECTION,
  WORKSPACE_HOST,
  WORKSPACE_ID,
  WORKSPACE_SECTION_KEYS,
  type WorkspaceField,
  type WorkspaceSectionId,
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

/** The workspace has no logo of its own yet, so it wears a mark drawn from its id: renaming it keeps the mark. */
function WorkspaceTile() {
  return <CompanyMark seed={WORKSPACE_ID} className='size-10 rounded-lg' />;
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
              <WorkspaceTile />
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
