import type { Fields, StepId } from './data';

export type FieldName = 'name' | 'slug' | 'source' | 'connection' | 'invites';

export type Errors = Partial<Record<FieldName, string>>;

/** The order the fields are read in: the first one with an error is the one that is said and focused. */
export const FIELD_ORDER: FieldName[] = [
  'name',
  'slug',
  'source',
  'connection',
  'invites',
];

const SHORTEST_NAME = 2;

const SHORTEST_SLUG = 3;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const SEPARATORS = /[\s,;]+/;

/** Solway Books becomes solway-books: what an address can hold, and nothing else. */
export function slugOf(name: string) {
  const lowered = name.toLowerCase();
  const words = lowered.split(/[^a-z0-9]+/);
  const kept = words.filter((word) => word !== '');
  return kept.join('-');
}

/**
 * One @ with something before it, and a dot inside what follows. Read by hand, piece by piece,
 * so a long pasted text can never make the check slow.
 */
function isEmail(text: string) {
  const at = text.indexOf('@');
  const hasOneAt = at > 0 && at === text.lastIndexOf('@');
  if (!hasOneAt) {
    return false;
  }
  const domain = text.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  const lastPlace = domain.length - 1;
  return dot > 0 && dot < lastPlace;
}

function nameErrorOf(name: string) {
  const trimmed = name.trim();
  if (trimmed.length < SHORTEST_NAME) {
    return 'Enter a name of at least 2 characters';
  }
  return undefined;
}

function slugErrorOf(slug: string) {
  if (slug === '') {
    return 'Enter an address for the workspace';
  }
  if (!SLUG.test(slug)) {
    return 'Use lowercase letters, numbers and single hyphens';
  }
  if (slug.length < SHORTEST_SLUG) {
    return 'Use at least 3 characters';
  }
  return undefined;
}

function workspaceErrorsOf(fields: Fields): Errors {
  return {
    name: nameErrorOf(fields.name),
    slug: slugErrorOf(fields.slug),
  };
}

function sourceErrorsOf(fields: Fields): Errors {
  if (fields.source === null) {
    return { source: 'Pick a source, or skip this step' };
  }
  if (fields.connection.trim() === '') {
    return { connection: 'Name this connection' };
  }
  return {};
}

function teamErrorsOf(fields: Fields): Errors {
  if (fields.invites.length === 0) {
    return { invites: 'Add at least one address, or skip this step' };
  }
  return {};
}

/** What keeps a step from being left with Next. The review step has nothing to check. */
export function errorsOf(step: StepId, fields: Fields): Errors {
  if (step === 'workspace') {
    return workspaceErrorsOf(fields);
  }
  if (step === 'source') {
    return sourceErrorsOf(fields);
  }
  if (step === 'team') {
    return teamErrorsOf(fields);
  }
  return {};
}

export function firstErrorOf(errors: Errors) {
  const field = FIELD_ORDER.find((name) => errors[name] !== undefined);
  if (!field) {
    return null;
  }
  return { field, message: errors[field] ?? '' };
}

export type Committed = {
  invites: string[];
  /** What could not be read as an address stays in the box. */
  inviteDraft: string;
  error?: string;
};

function notAnAddressLineOf(rejected: string[]) {
  const [first] = rejected;
  if (rejected.length === 1) {
    return `${first} is not an email address`;
  }
  return `${first} and ${rejected.length - 1} more are not email addresses`;
}

/**
 * Turns what the address box holds into addresses: several can be pasted at once, separated by
 * spaces, commas or semicolons. One that is already invited is not added twice.
 */
export function committedInvites(fields: Fields): Committed {
  const pieces = fields.inviteDraft.split(SEPARATORS);
  const typed = pieces.filter((piece) => piece !== '');
  const invites = [...fields.invites];
  const rejected: string[] = [];
  for (const piece of typed) {
    const address = piece.toLowerCase();
    if (!isEmail(address)) {
      rejected.push(piece);
      continue;
    }
    if (!invites.includes(address)) {
      invites.push(address);
    }
  }
  if (rejected.length === 0) {
    return { invites, inviteDraft: '' };
  }
  return {
    invites,
    inviteDraft: rejected.join(' '),
    error: notAnAddressLineOf(rejected),
  };
}
