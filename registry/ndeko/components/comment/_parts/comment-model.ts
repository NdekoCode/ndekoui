import { CURRENT_USER_ID, PEOPLE } from './people';
import { NOW } from './time';

export type CommentItem = {
  id: string;
  authorId: string;
  at: string;
  body: string;
  editedAt?: string;
};

export type Segment = {
  text: string;
  isMention: boolean;
};

export const MENTION_TRIGGER = '@';

export const MENTION_NAMES = PEOPLE.map((person) => person.name);

function mentionTokensOf(names: string[]) {
  const tokens = names.map((name) => `${MENTION_TRIGGER}${name}`);
  return tokens.sort((first, second) => second.length - first.length);
}

function pushPlain(segments: Segment[], text: string) {
  if (text.length === 0) {
    return;
  }
  segments.push({ text, isMention: false });
}

/** Splits a comment into plain text and mentions of known people, written "@First Last". */
export function segmentsOf(text: string, names: string[] = MENTION_NAMES) {
  const tokens = mentionTokensOf(names);
  const segments: Segment[] = [];
  let plain = '';
  let index = 0;
  while (index < text.length) {
    const token = tokens.find((candidate) => text.startsWith(candidate, index));
    if (token) {
      pushPlain(segments, plain);
      segments.push({ text: token, isMention: true });
      plain = '';
      index += token.length;
      continue;
    }
    plain += text[index];
    index += 1;
  }
  pushPlain(segments, plain);
  return segments;
}

let draftCount = 0;

/** A comment the signed-in person just wrote, stamped with the previews' fixed now. */
export function draftCommentOf(body: string): CommentItem {
  draftCount += 1;
  return {
    id: `draft-${draftCount}`,
    authorId: CURRENT_USER_ID,
    at: NOW,
    body,
  };
}

export function commentWordOf(count: number) {
  if (count === 1) {
    return 'comment';
  }
  return 'comments';
}

export function replyWordOf(count: number) {
  if (count === 1) {
    return 'reply';
  }
  return 'replies';
}
