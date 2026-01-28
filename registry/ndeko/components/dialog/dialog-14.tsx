import { useId } from 'react';

import { GoogleBrandIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { Button } from '@/registry/ndeko/ui/button';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
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
  'text-primary-ink rounded-sm text-[13px] font-medium underline-offset-4 hover:underline',
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

export default function Dialog14() {
  const id = useId();
  const emailId = `${id}-email`;
  const passwordId = `${id}-password`;
  const rememberId = `${id}-remember`;

  return (
    <Dialog>
      <DialogTrigger render={<Button variant='outline' />}>
        Sign in
      </DialogTrigger>
      <DialogContent className='max-w-md'>
        <div className='flex flex-col items-center gap-4'>
          <AcmeMark />
          <DialogHeader className='px-8 text-center'>
            <DialogTitle>Welcome back</DialogTitle>
            <DialogDescription>
              Sign in with the email and password of your Acme account.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form className='flex flex-col gap-5'>
          <div className='flex flex-col gap-4'>
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
                autoComplete='current-password'
                placeholder='Your password'
                required
              />
            </div>
          </div>
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <Checkbox id={rememberId} />
              <Label
                htmlFor={rememberId}
                className='text-muted-foreground font-normal'
              >
                Remember me
              </Label>
            </div>
            <a href='#' className={LINK}>
              Forgot password?
            </a>
          </div>
          <Button type='button' size='lg' className='w-full'>
            Sign in
          </Button>
        </form>
        <div className={OR_DIVIDER}>or</div>
        <Button variant='outline' size='lg'>
          <GoogleBrandIcon />
          Sign in with Google
        </Button>
      </DialogContent>
    </Dialog>
  );
}
