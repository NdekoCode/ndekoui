type TextPiece = { text: string; isMatch: boolean };

export function piecesOf(text: string, query: string): TextPiece[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return [{ text, isMatch: false }];
  }
  const haystack = text.toLowerCase();
  const pieces: TextPiece[] = [];
  let cursor = 0;
  let found = haystack.indexOf(needle, cursor);
  while (found >= 0) {
    const before = text.slice(cursor, found);
    const matchEnd = found + needle.length;
    const match = text.slice(found, matchEnd);
    if (before !== '') {
      pieces.push({ text: before, isMatch: false });
    }
    pieces.push({ text: match, isMatch: true });
    cursor = matchEnd;
    found = haystack.indexOf(needle, cursor);
  }
  const rest = text.slice(cursor);
  if (rest !== '') {
    pieces.push({ text: rest, isMatch: false });
  }
  return pieces;
}

export function includesQuery(text: string, query: string) {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return true;
  }
  const haystack = text.toLowerCase();
  return haystack.includes(needle);
}

type MarkedProps = {
  text: string;
  query: string;
};

export function Marked({ text, query }: MarkedProps) {
  const pieces = piecesOf(text, query);

  return (
    <>
      {pieces.map((piece, index) => {
        if (piece.isMatch) {
          return (
            <mark
              key={index}
              className='bg-warning/25 text-foreground rounded-[3px] px-px'
            >
              {piece.text}
            </mark>
          );
        }
        return <span key={index}>{piece.text}</span>;
      })}
    </>
  );
}
