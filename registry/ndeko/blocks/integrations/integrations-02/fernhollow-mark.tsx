import { cn } from '@/registry/ndeko/lib/utils';

type FernhollowMarkProps = {
  className?: string;
};

export function FernhollowMark({ className }: FernhollowMarkProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
      focusable='false'
      className={cn('size-6 shrink-0', className)}
    >
      <path
        d='M12 20V5'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
      />
      <path d='M12 16.2Q7.6 16.4 5.2 12.6Q9.7 12.3 12 16.2Z' />
      <path d='M12 13.2Q16.4 13.4 18.8 9.6Q14.3 9.3 12 13.2Z' />
      <path d='M12 10.2Q8.7 10.3 6.9 6.9Q10.3 6.7 12 10.2Z' />
      <path d='M12 7.2Q14.9 7.3 16.3 3.9Q13.3 3.8 12 7.2Z' />
    </svg>
  );
}
