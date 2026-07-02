import Link from 'next/link';

import { ArrowUpRightIcon } from '@/registry/ndeko/lib/icons';

type BuiltWithProps = {
  /** The name of the motion component, as its docs page spells it. */
  name: string;
  href: string;
};

/** Says which motion component a section of the home page is made of, and links to it. */
export function BuiltWith({ name, href }: BuiltWithProps) {
  return (
    <p className='text-muted-foreground text-xs'>
      {'This section runs on '}
      <Link
        href={href}
        className='text-foreground focus-visible:ring-ring/25 inline-flex items-center gap-0.5 rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]'
      >
        {name}
        <ArrowUpRightIcon className='size-3' />
      </Link>
    </p>
  );
}
