import { Skeleton } from '@/registry/ndeko/ui/skeleton';
import { Spinner } from '@/registry/ndeko/ui/spinner';
import { StatusOrb, type StatusOrbTone } from '@/registry/ndeko/ui/status-orb';

const TONES: StatusOrbTone[] = [
  'success',
  'error',
  'warning',
  'info',
  'loading',
];

export function StatusOrbDemo() {
  return (
    <div className='flex flex-col items-center gap-6'>
      <div className='flex items-center gap-4'>
        {TONES.map((tone) => (
          <StatusOrb key={tone} tone={tone} />
        ))}
      </div>
      <div className='flex items-center gap-3'>
        {TONES.map((tone) => (
          <StatusOrb key={tone} tone={tone} size='sm' />
        ))}
      </div>
    </div>
  );
}

export function SpinnerDemo() {
  return (
    <div className='flex flex-col items-center gap-4'>
      <Spinner />
      <p className='text-muted-foreground flex items-center gap-2 text-[13px]'>
        <Spinner label='Loading comments' />
        <span aria-hidden='true'>Loading comments</span>
      </p>
    </div>
  );
}

export function SkeletonDemo() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-4'>
      <div className='flex items-center gap-3'>
        <Skeleton className='size-10 rounded-full' />
        <div className='flex flex-1 flex-col gap-2'>
          <Skeleton className='h-3 w-3/4' />
          <Skeleton className='h-3 w-1/2' />
        </div>
      </div>
      <Skeleton className='h-20 w-full rounded-xl' />
    </div>
  );
}
