import { DottedMap } from '@/components/core/dotted-map';
import { MapPinIcon } from '@/registry/ndeko/lib/icons';

import { BentoCard } from './bento-card';
import { PLACE } from './data';

const MARKERS = [{ lat: PLACE.location.lat, lng: PLACE.location.lng }];

export function PlaceCard({ className }: { className?: string }) {
  return (
    <BentoCard title='Where I am' className={className}>
      <div className='bg-foreground/[0.04] relative flex h-36 items-center overflow-hidden rounded-xl'>
        <div className='w-full origin-[54%_62%] scale-[2.3]'>
          <DottedMap
            markers={MARKERS}
            label={`A map with a marker on ${PLACE.city}`}
            markerSize={1.3}
          />
        </div>
      </div>
      <div className='flex flex-col gap-1'>
        <p className='flex items-center gap-1.5 text-[13px] font-medium'>
          <MapPinIcon className='text-primary-ink size-3.5' />
          {PLACE.city}, {PLACE.country}
        </p>
        <p className='text-muted-foreground text-xs'>{PLACE.hours}</p>
        <p className='text-muted-foreground text-xs text-pretty'>
          {PLACE.note}
        </p>
      </div>
    </BentoCard>
  );
}
