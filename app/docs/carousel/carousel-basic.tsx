import {
  Carousel,
  CarouselContent,
  CarouselNavigation,
  CarouselIndicator,
  CarouselItem,
} from '@/components/core/carousel';
import {
  CalendarIcon,
  ChartLineIcon,
  LayersIcon,
  MessageCircleIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

const SLIDES = [
  {
    title: 'Weekly planning',
    meta: '12 tasks',
    icon: CalendarIcon,
    tile: 'bg-primary/10',
    gem: '[--gem:var(--primary)]',
  },
  {
    title: 'Launch checklist',
    meta: '8 tasks',
    icon: LayersIcon,
    tile: 'bg-success/10',
    gem: '[--gem:var(--success)]',
  },
  {
    title: 'Design review',
    meta: '5 tasks',
    icon: MessageCircleIcon,
    tile: 'bg-warning/10',
    gem: '[--gem:var(--warning)]',
  },
  {
    title: 'Quarterly report',
    meta: '1 task',
    icon: ChartLineIcon,
    tile: 'bg-info/10',
    gem: '[--gem:var(--info)]',
  },
];

export function CarouselBasic() {
  return (
    <div className='relative w-full max-w-xs'>
      <Carousel>
        <CarouselContent>
          {SLIDES.map((slide) => {
            const Glyph = slide.icon;

            return (
              <CarouselItem key={slide.title} className='p-4'>
                <div
                  className={cn(
                    'flex aspect-square flex-col justify-between rounded-xl p-4',
                    slide.tile
                  )}
                >
                  <span
                    className={cn(
                      'gem-plate grid size-9 place-items-center rounded-lg',
                      slide.gem
                    )}
                  >
                    <Glyph className='size-4' />
                  </span>
                  <span className='flex flex-col'>
                    <span className='text-foreground text-sm font-medium'>
                      {slide.title}
                    </span>
                    <span className='text-muted-foreground text-xs'>
                      {slide.meta}
                    </span>
                  </span>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselNavigation alwaysShow />
        <CarouselIndicator />
      </Carousel>
    </div>
  );
}
