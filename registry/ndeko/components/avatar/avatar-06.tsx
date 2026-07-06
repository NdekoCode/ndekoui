import { Avatar } from '@/registry/ndeko/ui/avatar';

export default function Avatar06() {
  return (
    <div className='relative inline-flex'>
      <Avatar seed='Kelly King' role='img' aria-label='Kelly King' />
      <span className='border-card bg-muted-foreground absolute -end-0.5 -bottom-0.5 size-3 rounded-full border-2'>
        <span className='sr-only'>Offline</span>
      </span>
    </div>
  );
}
