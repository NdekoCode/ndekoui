type LiveRegionProps = {
  message: string;
};

export function LiveRegion({ message }: LiveRegionProps) {
  return (
    <p aria-live='polite' aria-atomic='true' className='sr-only'>
      {message}
    </p>
  );
}
