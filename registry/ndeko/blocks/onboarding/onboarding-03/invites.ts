const SEPARATORS = /[\s,;]+/;

/** A space, a comma or a semicolon ends an address as it is typed. */
export const ENDS_AN_ADDRESS = /[\s,;]$/;

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

export type Committed = {
  invites: string[];
  /** What could not be read as an address stays in the box. */
  draft: string;
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
export function committedInvites(current: string[], draft: string): Committed {
  const pieces = draft.split(SEPARATORS);
  const typed = pieces.filter((piece) => piece !== '');
  const invites = [...current];
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
    return { invites, draft: '' };
  }
  return {
    invites,
    draft: rejected.join(' '),
    error: notAnAddressLineOf(rejected),
  };
}
