type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  action,
}: SectionHeadingProps) {
  return (
    <div className='flex flex-wrap items-end justify-between gap-x-8 gap-y-4'>
      <div className='flex max-w-xl flex-col gap-2'>
        <p className='text-primary-ink text-xs font-medium tabular-nums'>
          {eyebrow}
        </p>
        <h2 id={id} className='text-2xl font-semibold text-balance sm:text-3xl'>
          {title}
        </h2>
        <p className='text-muted-foreground text-sm text-pretty'>
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
