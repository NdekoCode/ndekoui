import { ProgressiveBlur } from '@/components/core/progressive-blur';

export function ProgressiveBlurBasic() {
  return (
    <div className='relative my-4 aspect-square w-[300px] overflow-hidden rounded-xl'>
      <div
        role='img'
        aria-label='Tide study by Nadia Haddad: a low sun over two bands of sea, in flat shapes.'
        className='bg-primary/10 absolute inset-0'
      >
        <div className='bg-primary/45 absolute top-12 left-10 size-32 rounded-full' />
        <div className='bg-primary/25 absolute top-28 right-8 size-24 rounded-lg' />
        <div className='bg-primary/20 absolute bottom-24 left-0 h-12 w-full' />
        <div className='bg-primary/35 absolute bottom-0 left-0 h-24 w-full' />
      </div>
      <ProgressiveBlur
        className='pointer-events-none absolute bottom-0 left-0 h-[50%] w-full'
        blurIntensity={6}
      />
      <div className='absolute bottom-0 left-0'>
        <div className='flex flex-col items-start gap-0 px-5 py-4'>
          <p className='text-foreground text-sm font-medium'>Nadia Haddad</p>
          <span className='text-muted-foreground mb-2 text-sm'>
            Tide study, 2025
          </span>
          <p className='text-foreground text-sm'>
            Gouache on paper. 40 cm by 30 cm
          </p>
        </div>
      </div>
    </div>
  );
}
