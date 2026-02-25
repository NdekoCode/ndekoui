import {
  Carousel,
  CarouselContent,
  CarouselNavigation,
  CarouselItem,
} from '@/components/core/carousel';

const DAYS = [
  { day: 'Mon', date: 12, meetings: 3 },
  { day: 'Tue', date: 13, meetings: 1 },
  { day: 'Wed', date: 14, meetings: 4 },
  { day: 'Thu', date: 15, meetings: 2 },
  { day: 'Fri', date: 16, meetings: 1 },
  { day: 'Sat', date: 17, meetings: 0 },
  { day: 'Sun', date: 18, meetings: 0 },
];

function meetingsLabel(count: number) {
  if (count === 0) {
    return 'Free';
  }
  if (count === 1) {
    return '1 meeting';
  }
  return `${count} meetings`;
}

export function CarouselSpacing() {
  return (
    <div className='relative w-full px-4'>
      <Carousel>
        <CarouselContent className='-ml-4'>
          {DAYS.map((day) => (
            <CarouselItem key={day.day} className='basis-1/3 pl-4'>
              <div className='bg-card hairline-ring ring-border flex aspect-square flex-col items-center justify-center rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
                <span className='text-muted-foreground text-xs'>{day.day}</span>
                <span className='text-foreground text-lg font-semibold tabular-nums'>
                  {day.date}
                </span>
                <span className='text-muted-foreground text-xs'>
                  {meetingsLabel(day.meetings)}
                </span>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselNavigation
          className='absolute top-auto -bottom-20 left-auto w-full justify-end gap-2'
          classNameButton='bg-foreground *:stroke-background'
          alwaysShow
        />
      </Carousel>
    </div>
  );
}
