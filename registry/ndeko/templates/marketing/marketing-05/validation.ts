export type ContactValues = {
  name: string;
  email: string;
  company: string;
  teamSize: string;
  message: string;
};

export type ContactField = keyof ContactValues;

export type ContactErrors = Partial<Record<ContactField, string>>;

export const MESSAGE_MIN_LENGTH = 20;

export const MESSAGE_MAX_LENGTH = 1000;

export const EMPTY_VALUES: ContactValues = {
  name: '',
  email: '',
  company: '',
  teamSize: '',
  message: '',
};

const FIELD_ORDER: ContactField[] = [
  'name',
  'email',
  'company',
  'teamSize',
  'message',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isContactField(value: string): value is ContactField {
  return FIELD_ORDER.some((field) => field === value);
}

function isBlank(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0;
}

function nameErrorOf(value: string) {
  if (isBlank(value)) {
    return 'Enter your name so we know who to answer';
  }
  return null;
}

function emailErrorOf(value: string) {
  if (isBlank(value)) {
    return 'Enter your work email';
  }
  const trimmed = value.trim();
  const isEmailShaped = EMAIL_PATTERN.test(trimmed);
  if (!isEmailShaped) {
    return 'Check the address, it should look like name@company.com';
  }
  return null;
}

function teamSizeErrorOf(value: string) {
  if (isBlank(value)) {
    return 'Pick the size of your team';
  }
  return null;
}

function messageErrorOf(value: string) {
  const trimmed = value.trim();
  const isTooShort = trimmed.length < MESSAGE_MIN_LENGTH;
  if (isTooShort) {
    return `Tell us a little more, at least ${MESSAGE_MIN_LENGTH} characters`;
  }
  const isTooLong = trimmed.length > MESSAGE_MAX_LENGTH;
  if (isTooLong) {
    return 'Keep the message under 1,000 characters';
  }
  return null;
}

function addError(
  errors: ContactErrors,
  field: ContactField,
  error: string | null
) {
  if (error) {
    errors[field] = error;
  }
}

export function errorsOf(values: ContactValues) {
  const errors: ContactErrors = {};
  const nameError = nameErrorOf(values.name);
  const emailError = emailErrorOf(values.email);
  const teamSizeError = teamSizeErrorOf(values.teamSize);
  const messageError = messageErrorOf(values.message);
  addError(errors, 'name', nameError);
  addError(errors, 'email', emailError);
  addError(errors, 'teamSize', teamSizeError);
  addError(errors, 'message', messageError);
  return errors;
}

export function firstInvalidFieldOf(errors: ContactErrors) {
  const invalidFields = FIELD_ORDER.filter((field) => errors[field]);
  if (invalidFields.length === 0) {
    return null;
  }
  return invalidFields[0];
}

export function firstNameOf(name: string) {
  const trimmed = name.trim();
  const words = trimmed.split(' ');
  return words[0];
}
