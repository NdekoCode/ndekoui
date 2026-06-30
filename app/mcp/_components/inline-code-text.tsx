const CODE_DELIMITER = '`';

function isCodePart(index: number) {
  return index % 2 === 1;
}

function InlinePart({ part, isCode }: { part: string; isCode: boolean }) {
  if (isCode) {
    return (
      <code className='bg-foreground/[0.06] rounded-sm px-1 py-0.5 font-mono text-[12px]'>
        {part}
      </code>
    );
  }
  return part;
}

/** Renders the parts of a sentence written between backticks as inline code. */
export function InlineCodeText({ text }: { text: string }) {
  const parts = text.split(CODE_DELIMITER);
  return parts.map((part, index) => (
    <InlinePart key={index} part={part} isCode={isCodePart(index)} />
  ));
}
