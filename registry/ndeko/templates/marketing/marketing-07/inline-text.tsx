type InlineTextProps = {
  text: string;
};

/** Words between backticks are code. */
export function InlineText({ text }: InlineTextProps) {
  const pieces = text.split('`');

  return (
    <>
      {pieces.map((piece, index) => {
        const isCode = index % 2 === 1;
        if (isCode) {
          return (
            <code
              key={index}
              className='bg-foreground/[0.06] rounded-[5px] px-1.5 py-0.5 font-mono text-[0.85em]'
            >
              {piece}
            </code>
          );
        }
        return <span key={index}>{piece}</span>;
      })}
    </>
  );
}
