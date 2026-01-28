import { useId } from 'react';

import { GoogleBrandIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/registry/ndeko/ui/dialog';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';

const BRAND_STYLE = { '--gem': 'var(--primary)' } as React.CSSProperties;

const LINK = [
  'text-primary-ink rounded-sm font-medium underline-offset-4 hover:underline',
  FOCUS_RING,
].join(' ');

const OR_DIVIDER =
  'text-muted-foreground flex items-center gap-3 text-xs before:h-(--hairline) before:flex-1 before:bg-border after:h-(--hairline) after:flex-1 after:bg-border';

function AcmeMark() {
  return (
    <span
      aria-hidden='true'
      style={BRAND_STYLE}
      className='gem-plate flex size-10 shrink-0 items-center justify-center rounded-xl'
    >
      <svg
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth={2.25}
        strokeLinecap='round'
        strokeLinejoin='round'
        className='size-5'
      >
        <path d='M12 4.5 20 19H4l8-14.5Z' />
        <path d='M8.75 14h6.5' />
      </svg>
    </span>
  );
}

export default function Dialog13() {
  const id = useId();
  const nameId = `${id}-name`;
  const emailId = `${id}-email`;
  const passwordId = `${id}-password`;

  return (
    <Dialog>
      <DialogTrigger render={<Button variant='outline' />}>
        Sign up
      </DialogTrigger>
      <DialogContent className='max-w-md'>
        <div className='flex flex-col items-center gap-4'>
          <AcmeMark />
          <DialogHeader className='px-8 text-center'>
            <DialogTitle>Create your Acme account</DialogTitle>
            <DialogDescription>
              We only need a few details to get you started.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form className='flex flex-col gap-5'>
          <div className='flex flex-col gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor={nameId}>Full name</Label>
              <Input
                id={nameId}
                autoComplete='name'
                placeholder='Amara Okafor'
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor={emailId}>Email</Label>
              <Input
                id={emailId}
                type='email'
                autoComplete='email'
                placeholder='amara@example.com'
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor={passwordId}>Password</Label>
              <Input
                id={passwordId}
                type='password'
                autoComplete='new-password'
                placeholder='At least 8 characters'
                required
              />
            </div>
          </div>
          <Button type='button' size='lg' className='w-full'>
            Create account
          </Button>
        </form>
        <div className={OR_DIVIDER}>or</div>
        <Button variant='outline' size='lg'>
          <GoogleBrandIcon />
          Continue with Google
        </Button>
        <p className='text-muted-foreground text-center text-xs'>
          By signing up you agree to our{' '}
          <a href='#' className={LINK}>
            Terms
          </a>
          .
        </p>
      </DialogContent>
    </Dialog>
  );
}
