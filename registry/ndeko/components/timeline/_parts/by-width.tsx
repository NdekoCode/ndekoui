type ByWidthProps = {
  narrow: React.ReactNode;
  wide: React.ReactNode;
};

/*
 * A timeline takes its orientation as a prop, so a piece that lies along a line draws both and its
 * own width decides which one shows: under 576px four columns do not fit, and the list stacks.
 */
export function ByWidth({ narrow, wide }: ByWidthProps) {
  return (
    <div className='@container w-full'>
      <div className='@xl:hidden'>{narrow}</div>
      <div className='@max-xl:hidden'>{wide}</div>
    </div>
  );
}
