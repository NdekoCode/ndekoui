export type SqlTokenKind =
  'keyword' | 'function' | 'string' | 'number' | 'comment' | 'plain';

export type SqlToken = {
  text: string;
  kind: SqlTokenKind;
};

const KEYWORDS = new Set([
  'SELECT',
  'FROM',
  'WHERE',
  'GROUP',
  'BY',
  'ORDER',
  'HAVING',
  'LIMIT',
  'AS',
  'AND',
  'OR',
  'NOT',
  'IN',
  'IS',
  'NULL',
  'JOIN',
  'LEFT',
  'INNER',
  'ON',
  'DISTINCT',
  'DESC',
  'ASC',
  'BETWEEN',
  'LIKE',
  'WITH',
]);

/** One group per kind of token: comment, string, number, word, space, any other character. */
const TOKEN =
  /(--.*$)|('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+)|(.)/g;

function wordKindOf(word: string, nextCharacter: string | undefined) {
  if (KEYWORDS.has(word.toUpperCase())) {
    return 'keyword';
  }
  if (nextCharacter === '(') {
    return 'function';
  }
  return 'plain';
}

function kindOf(match: RegExpMatchArray, line: string): SqlTokenKind {
  const [text, comment, quoted, number, word] = match;
  if (comment) {
    return 'comment';
  }
  if (quoted) {
    return 'string';
  }
  if (number) {
    return 'number';
  }
  if (word) {
    const end = (match.index ?? 0) + text.length;
    return wordKindOf(word, line[end]);
  }
  return 'plain';
}

/** One line of SQL cut into pieces to colour. Joining their text gives the line back. */
export function sqlTokensOf(line: string) {
  const tokens: SqlToken[] = [];
  for (const match of line.matchAll(TOKEN)) {
    const kind = kindOf(match, line);
    tokens.push({ text: match[0], kind });
  }
  return tokens;
}
