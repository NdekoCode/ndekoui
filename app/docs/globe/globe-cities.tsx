import {
  Globe,
  type GlobeArc,
  type GlobeMarker,
} from '@/components/core/globe';

const KINSHASA: GlobeMarker['location'] = [-4.44, 15.27];

const LAGOS: GlobeMarker['location'] = [6.52, 3.38];

const LISBON: GlobeMarker['location'] = [38.72, -9.14];

const MONTREAL: GlobeMarker['location'] = [45.5, -73.57];

const NAIROBI: GlobeMarker['location'] = [-1.29, 36.82];

const SINGAPORE: GlobeMarker['location'] = [1.35, 103.82];

const MARKERS: GlobeMarker[] = [
  { location: KINSHASA, label: 'Kinshasa', size: 0.07 },
  { location: LAGOS, label: 'Lagos' },
  { location: LISBON, label: 'Lisbon' },
  { location: MONTREAL, label: 'Montreal' },
  { location: NAIROBI, label: 'Nairobi' },
  { location: SINGAPORE, label: 'Singapore' },
];

const ARCS: GlobeArc[] = [
  { from: KINSHASA, to: LISBON },
  { from: KINSHASA, to: NAIROBI },
  { from: LISBON, to: MONTREAL },
];

export function GlobeCities() {
  return (
    <div className='flex w-full flex-col items-center gap-2 py-6'>
      <Globe
        markers={MARKERS}
        arcs={ARCS}
        label='Globe showing the six cities of a fictional team'
        className='max-w-[420px]'
      />
      <p className='text-muted-foreground text-xs'>
        Illustrative: the cities of a fictional team
      </p>
    </div>
  );
}
