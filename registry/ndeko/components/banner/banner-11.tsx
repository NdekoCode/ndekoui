import { MailIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

export default function Banner11() {
  return (
    <div className='bg-card hairline-ring ring-border w-full rounded-xl px-4 py-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex items-center justify-center gap-3'>
        <StatusOrb
          tone='brand'
          size='sm'
          glyph={<MailIcon strokeWidth={2.25} />}
        />
        <p className='text-[13px]'>
          Subscribe to our newsletter and get 10% off your first order{' '}
          <span className='text-muted-foreground mx-1' aria-hidden='true'>
            ·
          </span>{' '}
          <a
            href='#'
            className={cn(
              'text-primary-ink rounded-sm font-medium underline underline-offset-4 hover:no-underline',
              FOCUS_RING
            )}
          >
            Subscribe
          </a>
        </p>
      </div>
    </div>
  );
}
