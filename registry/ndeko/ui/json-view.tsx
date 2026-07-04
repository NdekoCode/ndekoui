import { cn } from '@/registry/ndeko/lib/utils';

type JsonTokenKind = 'key' | 'string' | 'number' | 'literal' | 'mark' | 'space';

type JsonToken = {
  kind: JsonTokenKind;
  text: string;
};

const TOKEN_PATTERN =
  /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(true|false|null)|([{}[\],:])|(\s+)/g;

const TOKEN_CLASS: Record<JsonTokenKind, string> = {
  key: 'text-foreground',
  string: 'text-primary-ink',
  number: 'text-muted-foreground',
  literal: 'text-muted-foreground',
  mark: 'text-muted-foreground/60',
  space: '',
};

function tokensOfMatch(match: RegExpMatchArray): JsonToken[] {
  const [, quoted, colon, number, literal, mark, space] = match;
  if (quoted !== undefined) {
    if (colon !== undefined) {
      return [
        { kind: 'key', text: quoted },
        { kind: 'mark', text: colon },
      ];
    }
    return [{ kind: 'string', text: quoted }];
  }
  if (number !== undefined) {
    return [{ kind: 'number', text: number }];
  }
  if (literal !== undefined) {
    return [{ kind: 'literal', text: literal }];
  }
  if (mark !== undefined) {
    return [{ kind: 'mark', text: mark }];
  }
  return [{ kind: 'space', text: space ?? '' }];
}

export function jsonTokensOf(source: string) {
  const tokens: JsonToken[] = [];
  for (const match of source.matchAll(TOKEN_PATTERN)) {
    const matchTokens = tokensOfMatch(match);
    tokens.push(...matchTokens);
  }
  return tokens;
}

export function jsonTextOf(value: unknown) {
  if (value === undefined) {
    return '';
  }
  return JSON.stringify(value, null, 2);
}

type JsonViewProps = {
  value: unknown;
  className?: string;
};

export function JsonView({ value, className }: JsonViewProps) {
  const source = jsonTextOf(value);
  const tokens = jsonTokensOf(source);

  return (
    <pre
      className={cn(
        'bg-foreground/[0.03] dark:bg-foreground/[0.05] overflow-x-auto rounded-lg p-2.5 font-mono text-xs leading-relaxed',
        className
      )}
    >
      <code>
        {tokens.map((token, index) => (
          <span key={index} className={TOKEN_CLASS[token.kind]}>
            {token.text}
          </span>
        ))}
      </code>
    </pre>
  );
}
