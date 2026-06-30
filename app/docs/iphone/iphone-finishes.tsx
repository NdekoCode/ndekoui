import { Iphone, type IphoneFinish } from '@/components/core/iphone';

const FINISHES: { finish: IphoneFinish; label: string; src: string }[] = [
  {
    finish: 'natural',
    label: 'Natural titanium',
    src: '/images/scenes/scene-03.svg',
  },
  {
    finish: 'black',
    label: 'Black titanium',
    src: '/images/scenes/scene-04.svg',
  },
  {
    finish: 'white',
    label: 'White titanium',
    src: '/images/scenes/scene-06.svg',
  },
];

export function IphoneFinishes() {
  return (
    <div className='grid w-full max-w-2xl grid-cols-3 gap-4 px-4 py-10 sm:gap-8'>
      {FINISHES.map((item) => (
        <div key={item.finish} className='flex flex-col items-center gap-3'>
          <Iphone
            finish={item.finish}
            imageSrc={item.src}
            statusBar='dark'
            label={`Phone in ${item.label.toLowerCase()}`}
          />
          <span className='text-muted-foreground text-xs'>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
