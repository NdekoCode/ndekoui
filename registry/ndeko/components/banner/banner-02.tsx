import { ArrowRightIcon, MailIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

export default function Banner02() {
  return (
    <div className='bg-primary/[0.06] hairline-ring ring-primary/15 dark:bg-primary/10 w-full rounded-xl px-4 py-2.5'>
      <p className='flex justify-center text-[13px]'>
        <a
          href='#'
          className={cn(
            'group inline-flex items-center gap-2.5 rounded-md',
            FOCUS_RING
          )}
        >
          <StatusOrb
            tone='brand'
            size='sm'
            glyph={<MailIcon strokeWidth={2.25} />}
          />
          Introducing transactional and marketing emails
          <ArrowRightIcon className='size-4 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5' />
        </a>
      </p>
    </div>
  );
}
