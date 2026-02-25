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

export function CarouselCustomSizes() {
  return (
    <div className='relative w-full max-w-xs'>
      <Carousel>
        <CarouselContent>
          {DAYS.map((day) => (
            <CarouselItem key={day.day} className='basis-1/3 px-1'>
              <div className='bg-foreground/[0.04] flex aspect-square flex-col items-center justify-center rounded-lg'>
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
        <CarouselNavigation />
      </Carousel>
    </div>
  );
}
