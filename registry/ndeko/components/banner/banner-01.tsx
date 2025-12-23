import { Button } from '@/registry/ndeko/ui/button';

export default function Banner01() {
  return (
    <div
      role='region'
      aria-label='Cookie consent'
      className='surface-raised @container w-full rounded-xl px-4 py-3'
    >
      <div className='flex flex-col justify-between gap-3 @xl:flex-row @xl:items-center'>
        <p className='text-[13px]'>
          We use cookies to improve your experience, measure site usage and show
          content that fits you.
        </p>
        <div className='flex flex-wrap gap-2'>
          <Button size='sm'>Accept</Button>
          <Button variant='outline' size='sm'>
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
