import { markedPartsOf, type MarkedPart } from './search';

/** A mark keeps the browser's yellow unless its background is set. */
const MARK = 'rounded-[3px] bg-primary/15 text-inherit';

function Part({ part }: { part: MarkedPart }) {
  if (part.isMatch) {
    return <mark className={MARK}>{part.text}</mark>;
  }
  return <span>{part.text}</span>;
}

type MarkedTextProps = {
  text: string;
  words: string[];
};

export function MarkedText({ text, words }: MarkedTextProps) {
  const parts = markedPartsOf(text, words);

  return (
    <>
      {parts.map((part) => (
        <Part key={part.key} part={part} />
      ))}
    </>
  );
}
