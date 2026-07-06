import type { ProfileField, ProfileValues, ProfileSectionId } from './data';

export type ProfileErrors = Partial<Record<ProfileField, string>>;

const USERNAME_PATTERN = /^[a-z0-9-]{3,24}$/;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_PATTERN = /^\+?[\d\s().-]+$/;

const PHONE_MIN_DIGITS = 7;

const FIELD_ORDER: ProfileField[] = [
  'photo',
  'name',
  'username',
  'title',
  'bio',
  'email',
  'phone',
];

export const FIELD_SECTION: Record<ProfileField, ProfileSectionId> = {
  photo: 'profile',
  name: 'profile',
  username: 'profile',
  title: 'profile',
  bio: 'profile',
  email: 'contact',
  phone: 'contact',
  showEmail: 'contact',
  language: 'region',
  timeZone: 'region',
  weekStart: 'region',
  timeFormat: 'region',
};

function digitCountOf(text: string) {
  const digits = text.replace(/\D/g, '');
  return digits.length;
}

function phoneErrorOf(phone: string) {
  const trimmed = phone.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const hasAllowedCharacters = PHONE_PATTERN.test(trimmed);
  const digitCount = digitCountOf(trimmed);
  const hasEnoughDigits = digitCount >= PHONE_MIN_DIGITS;
  const isValid = hasAllowedCharacters && hasEnoughDigits;
  if (isValid) {
    return null;
  }
  return 'Enter a phone number with its country code, such as +234 803 555 0142';
}

export function errorsOf(values: ProfileValues): ProfileErrors {
  const errors: ProfileErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const isUsernameValid = USERNAME_PATTERN.test(values.username);
  const hasEmail = email.length > 0;
  const isEmailValid = EMAIL_PATTERN.test(email);
  const isEmailMalformed = hasEmail && !isEmailValid;
  const phoneError = phoneErrorOf(values.phone);
  if (name.length === 0) {
    errors.name = 'Enter your full name';
  }
  if (!isUsernameValid) {
    errors.username = 'Use 3 to 24 lowercase letters, digits or hyphens';
  }
  if (!hasEmail) {
    errors.email = 'Enter the email address you sign in with';
  }
  if (isEmailMalformed) {
    errors.email = 'Enter an email like name@company.com';
  }
  if (phoneError) {
    errors.phone = phoneError;
  }
  return errors;
}

export function firstErrorFieldOf(errors: ProfileErrors) {
  const field = FIELD_ORDER.find((candidate) => Boolean(errors[candidate]));
  if (field) {
    return field;
  }
  return null;
}

export function errorCountOf(errors: ProfileErrors) {
  const messages = Object.values(errors);
  return messages.filter(Boolean).length;
}

export function withoutError(errors: ProfileErrors, field: ProfileField) {
  if (!errors[field]) {
    return errors;
  }
  const next = { ...errors };
  delete next[field];
  return next;
}
