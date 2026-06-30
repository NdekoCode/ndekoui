import { DottedMap, type DottedMapMarker } from '@/components/core/dotted-map';

const OFFICES: DottedMapMarker[] = [
  { lat: -4.44, lng: 15.27, label: 'Kinshasa' },
  { lat: 38.72, lng: -9.14, label: 'Lisbon' },
  { lat: 45.5, lng: -73.57, label: 'Montreal' },
  { lat: -1.29, lng: 36.82, label: 'Nairobi' },
  { lat: 1.35, lng: 103.82, label: 'Singapore' },
];

export function DottedMapOffices() {
  return (
    <div className='flex w-full max-w-2xl flex-col gap-3 px-4 py-10'>
      <DottedMap
        markers={OFFICES}
        pulse
        label='World map with the five offices of a fictional company'
      />
      <p className='text-muted-foreground text-center text-xs'>
        Illustrative: the offices of a fictional company
      </p>
    </div>
  );
}
