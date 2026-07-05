'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { GlobeIcon, MailIcon, UserIcon } from '@/registry/ndeko/lib/icons';

import {
  BIO_MAX_LENGTH,
  INITIALS,
  LANGUAGES,
  PROFILE_HOST,
  PROFILE_SECTION_KEYS,
  TIME_FORMATS,
  TIME_FORMAT_SAMPLE,
  TIME_ZONES,
  WEEK_STARTS,
  type ProfileField,
  type ProfileValues,
  type ProfileSectionId,
} from './data';
import { BioRow, PhotoRow } from './profile-fields';
import {
  ChoiceRow,
  SectionPanel,
  SectionTabs,
  SelectRow,
  SettingsPage,
  SettingsSection,
  SwitchRow,
  TextRow,
  UnsavedBar,
  hasChangeIn,
  useSettingsDraft,
  type NavItem,
} from './settings-kit';
import {
  FIELD_SECTION,
  errorCountOf,
  errorsOf,
  firstErrorFieldOf,
  withoutError,
  type ProfileErrors,
} from './validation';

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'contact', label: 'Contact', icon: MailIcon },
  { id: 'region', label: 'Language and region', icon: GlobeIcon },
] as const;

const SAMPLE_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SAMPLE_VARIANTS: Variants = {
  enter: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function sampleVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SAMPLE_VARIANTS;
}

function fieldIdOf(field: ProfileField) {
  return `profile-${field}`;
}

function fixMessageOf(count: number) {
  if (count === 0) {
    return undefined;
  }
  if (count === 1) {
    return 'Fix 1 field to save';
  }
  return `Fix ${count} fields to save`;
}

function pageAddressOf(username: string) {
  const handle = username.trim();
  if (handle.length === 0) {
    return `${PROFILE_HOST}your-name`;
  }
  return `${PROFILE_HOST}${handle}`;
}

function emailLineOf(isChanged: boolean) {
  if (isChanged) {
    return 'A confirmation link goes to the new address before it replaces the old one';
  }
  return 'Verified, used to sign in and for notifications';
}

function focusField(field: ProfileField) {
  const fieldId = fieldIdOf(field);
  window.requestAnimationFrame(() => {
    document.getElementById(fieldId)?.focus();
  });
}

/** The sample line under the time format swaps with the format it describes. */
function TimeSample({ format }: { format: ProfileValues['timeFormat'] }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = sampleVariantsOf(shouldReduceMotion);

  return (
    <span className='relative block'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={format}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SAMPLE_TRANSITION}
          className='block'
        >
          {TIME_FORMAT_SAMPLE[format]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

type ProfilePageProps = {
  values: ProfileValues;
  workspaceName: string;
  onSaved: (values: ProfileValues) => void;
};

export function ProfilePage({
  values,
  workspaceName,
  onSaved,
}: ProfilePageProps) {
  const settings = useSettingsDraft<ProfileValues>(values, onSaved);
  const [section, setSection] = useState<ProfileSectionId>('profile');
  const [hasSwitched, setHasSwitched] = useState(false);
  const [shownErrors, setShownErrors] = useState<ProfileErrors>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const draft = settings.draft;
  const errorCount = errorCountOf(shownErrors);
  const fixMessage = fixMessageOf(errorCount);
  const pageAddress = pageAddressOf(draft.username);
  const isEmailChanged = settings.changedKeys.includes('email');
  const emailLine = emailLineOf(isEmailChanged);
  const navItems: NavItem<ProfileSectionId>[] = SECTIONS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    hasChanges: hasChangeIn(
      settings.changedKeys,
      PROFILE_SECTION_KEYS[item.id]
    ),
  }));

  function openSection(nextSection: ProfileSectionId) {
    setSection(nextSection);
    setHasSwitched(true);
  }

  function changeField<Field extends ProfileField>(
    field: Field,
    value: ProfileValues[Field]
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
    const fieldSection = FIELD_SECTION[firstField];
    if (fieldSection !== section) {
      openSection(fieldSection);
    }
    focusField(firstField);
  }

  function discard() {
    settings.discard();
    setShownErrors({});
    setPhotoError(null);
  }

  function changePhoto(photo: string) {
    changeField('photo', photo);
  }

  function changeName(name: string) {
    changeField('name', name);
  }

  function changeUsername(username: string) {
    const lowered = username.toLowerCase();
    changeField('username', lowered);
  }

  function changeTitle(title: string) {
    changeField('title', title);
  }

  function changeBio(bio: string) {
    changeField('bio', bio);
  }

  function changeEmail(email: string) {
    changeField('email', email);
  }

  function changePhone(phone: string) {
    changeField('phone', phone);
  }

  function changeShowEmail(showEmail: boolean) {
    changeField('showEmail', showEmail);
  }

  function changeLanguage(language: string) {
    changeField('language', language);
  }

  function changeTimeZone(timeZone: string) {
    changeField('timeZone', timeZone);
  }

  function changeWeekStart(weekStart: ProfileValues['weekStart']) {
    changeField('weekStart', weekStart);
  }

  function changeTimeFormat(timeFormat: ProfileValues['timeFormat']) {
    changeField('timeFormat', timeFormat);
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
      title='Profile'
      line={`How you appear to the people of ${workspaceName}, and how dates and times read for you.`}
      bar={bar}
    >
      <SectionTabs
        label='Profile sections'
        items={navItems}
        value={section}
        onValueChange={openSection}
      >
        <SectionPanel value='profile' animatesIn={hasSwitched}>
          <SettingsSection
            title='Public profile'
            line='Teammates see this next to your tasks, comments and time'
          >
            <PhotoRow
              photo={draft.photo}
              initials={INITIALS}
              error={photoError}
              onPhotoChange={changePhoto}
              onError={setPhotoError}
            />
            <TextRow
              inputId={fieldIdOf('name')}
              label='Full name'
              line='As it appears on invoices and reports'
              value={draft.name}
              error={shownErrors.name}
              autoComplete='name'
              maxLength={60}
              onValueChange={changeName}
            />
            <TextRow
              inputId={fieldIdOf('username')}
              label='Username'
              line={pageAddress}
              value={draft.username}
              error={shownErrors.username}
              autoComplete='username'
              maxLength={24}
              onValueChange={changeUsername}
            />
            <TextRow
              inputId={fieldIdOf('title')}
              label='Title'
              line='Shown under your name in the member list'
              value={draft.title}
              autoComplete='organization-title'
              maxLength={60}
              onValueChange={changeTitle}
            />
            <BioRow
              value={draft.bio}
              maxLength={BIO_MAX_LENGTH}
              onValueChange={changeBio}
            />
          </SettingsSection>
        </SectionPanel>
        <SectionPanel value='contact' animatesIn={hasSwitched}>
          <SettingsSection
            title='How teammates reach you'
            line='Your email signs you in; your phone stays optional'
          >
            <TextRow
              inputId={fieldIdOf('email')}
              type='email'
              label='Email'
              line={emailLine}
              value={draft.email}
              error={shownErrors.email}
              autoComplete='email'
              onValueChange={changeEmail}
            />
            <TextRow
              inputId={fieldIdOf('phone')}
              type='tel'
              inputMode='tel'
              label='Phone'
              line='Optional, for urgent calls from your team'
              placeholder='+234 803 555 0142'
              value={draft.phone}
              error={shownErrors.phone}
              autoComplete='tel'
              onValueChange={changePhone}
            />
            <SwitchRow
              label='Show my email to teammates'
              line='Off keeps it visible to workspace admins only'
              checked={draft.showEmail}
              onCheckedChange={changeShowEmail}
            />
          </SettingsSection>
        </SectionPanel>
        <SectionPanel value='region' animatesIn={hasSwitched}>
          <SettingsSection
            title='Language and region'
            line='Applies to the app, your emails and your exports'
          >
            <SelectRow
              label='Language'
              line='Menus, emails and dates'
              value={draft.language}
              options={LANGUAGES}
              onValueChange={changeLanguage}
            />
            <SelectRow
              label='Time zone'
              line='Due dates and reminders follow it'
              value={draft.timeZone}
              options={TIME_ZONES}
              onValueChange={changeTimeZone}
            />
            <ChoiceRow
              label='Week starts on'
              line='Calendars and weekly reports'
              value={draft.weekStart}
              options={WEEK_STARTS}
              onValueChange={changeWeekStart}
            />
            <ChoiceRow
              label='Time format'
              line={<TimeSample format={draft.timeFormat} />}
              value={draft.timeFormat}
              options={TIME_FORMATS}
              onValueChange={changeTimeFormat}
            />
          </SettingsSection>
        </SectionPanel>
      </SectionTabs>
    </SettingsPage>
  );
}
