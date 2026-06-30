import { DottedMap, type DottedMapMarker } from '@/components/core/dotted-map';

const SESSIONS: DottedMapMarker[] = [
  { lat: 48.86, lng: 2.35, pulse: true },
  { lat: 6.52, lng: 3.38 },
  { lat: -23.55, lng: -46.63 },
  { lat: 19.08, lng: 72.88, pulse: true },
  { lat: 35.68, lng: 139.69 },
  { lat: 40.71, lng: -74.01 },
];

export function DottedMapCard() {
  return (
    <div className='bg-card hairline-ring ring-border w-full max-w-md rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex items-baseline justify-between gap-3'>
        <h3 className='text-sm font-medium'>Open sessions</h3>
        <span className='text-muted-foreground text-xs'>Illustrative</span>
      </div>
      <p className='text-muted-foreground mt-0.5 text-xs'>
        Six cities, two of them active in the last minute
      </p>
      <DottedMap
        markers={SESSIONS}
        dotSize={0.45}
        className='mt-4'
        dotClassName='text-foreground/15'
        label='World map with six open sessions, two of them active'
      />
    </div>
  );
}
