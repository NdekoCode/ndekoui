import {
  CheckIcon,
  MonitorIcon,
  SmartphoneIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/ndeko/ui/table';

type Availability = {
  platform: string;
  since: string | null;
};

type Feature = {
  name: string;
  desktop: Availability[];
  mobile: Availability[];
};

const FEATURES: Feature[] = [
  {
    name: 'Offline mode',
    desktop: [
      { platform: 'macOS', since: '2.1' },
      { platform: 'Windows', since: '2.1' },
      { platform: 'Linux', since: '2.3' },
      { platform: 'Web', since: null },
    ],
    mobile: [
      { platform: 'iOS', since: '3.0' },
      { platform: 'iPadOS', since: '3.0' },
      { platform: 'Android', since: '3.2' },
    ],
  },
  {
    name: 'Screen recording',
    desktop: [
      { platform: 'macOS', since: '1.8' },
      { platform: 'Windows', since: '1.8' },
      { platform: 'Linux', since: null },
      { platform: 'Web', since: '2.4' },
    ],
    mobile: [
      { platform: 'iOS', since: null },
      { platform: 'iPadOS', since: null },
      { platform: 'Android', since: '3.4' },
    ],
  },
  {
    name: 'Global shortcuts',
    desktop: [
      { platform: 'macOS', since: '1.2' },
      { platform: 'Windows', since: '1.2' },
      { platform: 'Linux', since: '1.5' },
      { platform: 'Web', since: null },
    ],
    mobile: [
      { platform: 'iOS', since: null },
      { platform: 'iPadOS', since: '3.1' },
      { platform: 'Android', since: null },
    ],
  },
  {
    name: 'Live cursors',
    desktop: [
      { platform: 'macOS', since: '2.6' },
      { platform: 'Windows', since: '2.6' },
      { platform: 'Linux', since: '2.6' },
      { platform: 'Web', since: '2.6' },
    ],
    mobile: [
      { platform: 'iOS', since: '3.3' },
      { platform: 'iPadOS', since: '3.3' },
      { platform: 'Android', since: '3.3' },
    ],
  },
];

const DESKTOP_PLATFORMS = FEATURES[0].desktop.map((entry) => entry.platform);
const MOBILE_PLATFORMS = FEATURES[0].mobile.map((entry) => entry.platform);
const ALL_PLATFORMS = [...DESKTOP_PLATFORMS, ...MOBILE_PLATFORMS];

const GRID_ROW = '*:border-border [&>:not(:last-child)]:hairline-r';

const VERTICAL_LABEL =
  'relative left-[calc(50%-0.5rem)] block rotate-180 leading-4 whitespace-nowrap [text-orientation:sideways] [writing-mode:vertical-rl]';

function AvailabilityMark({ since }: { since: string | null }) {
  if (since === null) {
    return (
      <>
        <XIcon
          aria-hidden='true'
          className='text-muted-foreground/60 inline-flex size-4'
        />
        <span className='sr-only'>Not available</span>
        <div className='text-muted-foreground text-xs font-medium'>No</div>
      </>
    );
  }
  return (
    <>
      <CheckIcon
        aria-hidden='true'
        className='text-success-foreground inline-flex size-4'
      />
      <span className='sr-only'>Available since version</span>
      <div className='text-muted-foreground text-xs font-medium tabular-nums'>
        {since}
      </div>
    </>
  );
}

export default function Table11() {
  return (
    <div className='w-full'>
      <Table>
        <TableHeader className='[&_tr:first-child]:border-b-0'>
          <TableRow className={`${GRID_ROW} hover:bg-transparent`}>
            <TableCell />
            <TableHead
              colSpan={DESKTOP_PLATFORMS.length}
              className='hairline-b border-border text-center'
            >
              <span className='inline-flex items-center gap-1.5'>
                <MonitorIcon aria-hidden='true' className='size-4' />
                Desktop
              </span>
            </TableHead>
            <TableHead
              colSpan={MOBILE_PLATFORMS.length}
              className='hairline-b border-border text-center'
            >
              <span className='inline-flex items-center gap-1.5'>
                <SmartphoneIcon aria-hidden='true' className='size-4' />
                Mobile
              </span>
            </TableHead>
          </TableRow>
          <TableRow className={`${GRID_ROW} hover:bg-transparent`}>
            <TableCell />
            {ALL_PLATFORMS.map((platform) => (
              <TableHead
                key={platform}
                className='text-foreground h-auto py-3 align-bottom'
              >
                <span className={VERTICAL_LABEL}>{platform}</span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {FEATURES.map((feature) => {
            const availabilities = [...feature.desktop, ...feature.mobile];
            return (
              <TableRow key={feature.name} className={GRID_ROW}>
                <TableHead
                  scope='row'
                  className='text-foreground text-[13px] font-medium'
                >
                  {feature.name}
                </TableHead>
                {availabilities.map((availability) => (
                  <TableCell
                    key={availability.platform}
                    className='space-y-1 text-center'
                  >
                    <AvailabilityMark since={availability.since} />
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
