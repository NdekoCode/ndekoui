import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';

export default function Avatar05() {
  return (
    <div className='relative inline-flex'>
      <Avatar>
        <AvatarImage src='/avatars/avatar-07.svg' alt='Kelly King' />
        <AvatarFallback>KK</AvatarFallback>
      </Avatar>
      <span className='border-card bg-success absolute -end-0.5 -bottom-0.5 size-3 rounded-full border-2'>
        <span className='sr-only'>Online</span>
      </span>
    </div>
  );
}
