import {
  MagnifiedDoc,
  MagnifiedDocDock,
  MagnifiedDocImage,
  MagnifiedDocItem,
  MagnifiedDocPanel,
  MagnifiedDocStage,
} from '@/components/core/magnified-doc';
import {
  CalendarIcon,
  FileTextIcon,
  HeadphonesIcon,
  ImageIcon,
  InboxIcon,
} from '@/registry/ndeko/lib/icons';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';

const MESSAGES = [
  {
    from: 'Ines Laurent',
    initials: 'IL',
    avatar: '/avatars/avatar-03.svg',
    subject: 'Cabin list for the coast trip',
    time: '09:12',
  },
  {
    from: 'Tomas Reyes',
    initials: 'TR',
    avatar: '/avatars/avatar-05.svg',
    subject: 'Ferry times changed on Friday',
    time: '08:40',
  },
  {
    from: 'Amara Diallo',
    initials: 'AD',
    avatar: '/avatars/avatar-06.svg',
    subject: 'Photos from the north ridge',
    time: 'Mon',
  },
];

const AGENDA = [
  { time: '08:30', title: 'Leave the harbour' },
  { time: '12:00', title: 'Lunch at the ridge hut' },
  { time: '18:45', title: 'Sunset at the dunes' },
];

const PANEL = 'flex h-full flex-col gap-4 p-6 pb-28';

const PANEL_TITLE = 'text-foreground text-sm font-medium';

export function MagnifiedDocWorkspace() {
  return (
    <div className='w-full max-w-2xl px-4 py-8'>
      <MagnifiedDoc defaultValue='inbox'>
        <MagnifiedDocStage className='bg-card hairline-ring ring-border aspect-auto h-96 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
          <MagnifiedDocPanel value='inbox'>
            <div className={PANEL}>
              <span className={PANEL_TITLE}>Inbox</span>
              <ul className='flex flex-col gap-3'>
                {MESSAGES.map((message) => (
                  <li key={message.subject} className='flex items-center gap-3'>
                    <Avatar>
                      <AvatarImage src={message.avatar} alt='' />
                      <AvatarFallback>{message.initials}</AvatarFallback>
                    </Avatar>
                    <span className='flex min-w-0 flex-1 flex-col'>
                      <span className='text-foreground truncate text-[13px] font-medium'>
                        {message.subject}
                      </span>
                      <span className='text-muted-foreground text-xs'>
                        {message.from}
                      </span>
                    </span>
                    <span className='text-muted-foreground text-xs tabular-nums'>
                      {message.time}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </MagnifiedDocPanel>
          <MagnifiedDocPanel value='calendar'>
            <div className={PANEL}>
              <span className={PANEL_TITLE}>Saturday, 14 June</span>
              <ul className='flex flex-col gap-2'>
                {AGENDA.map((entry) => (
                  <li
                    key={entry.title}
                    className='bg-foreground/[0.04] flex items-center gap-3 rounded-lg px-3 py-2'
                  >
                    <span className='text-muted-foreground w-12 text-xs tabular-nums'>
                      {entry.time}
                    </span>
                    <span className='text-foreground text-[13px]'>
                      {entry.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </MagnifiedDocPanel>
          <MagnifiedDocPanel value='notes'>
            <div className={PANEL}>
              <span className={PANEL_TITLE}>Packing notes</span>
              <p className='text-muted-foreground max-w-prose text-[13px] leading-relaxed'>
                Two warm layers for the ridge, the evenings drop to 9 degrees.
                The last ferry leaves at 20:10, so dinner stays near the
                harbour. Bring the long lens for the dunes.
              </p>
            </div>
          </MagnifiedDocPanel>
          <MagnifiedDocImage
            value='photos'
            src='/images/scenes/scene-03.svg'
            alt='The north ridge at midday'
          />
          <MagnifiedDocPanel value='music'>
            <div className={PANEL}>
              <span className={PANEL_TITLE}>Now playing</span>
              <div className='flex items-center gap-3'>
                <span className='keycap-3d grid size-12 place-items-center rounded-lg'>
                  <HeadphonesIcon className='size-5' />
                </span>
                <span className='flex flex-col'>
                  <span className='text-foreground text-[13px] font-medium'>
                    Coastline, side B
                  </span>
                  <span className='text-muted-foreground text-xs tabular-nums'>
                    Track 4 of 9
                  </span>
                </span>
              </div>
            </div>
          </MagnifiedDocPanel>
        </MagnifiedDocStage>
        <MagnifiedDocDock aria-label='Apps'>
          <MagnifiedDocItem value='inbox' label='Inbox'>
            <InboxIcon />
          </MagnifiedDocItem>
          <MagnifiedDocItem value='calendar' label='Calendar'>
            <CalendarIcon />
          </MagnifiedDocItem>
          <MagnifiedDocItem value='notes' label='Notes'>
            <FileTextIcon />
          </MagnifiedDocItem>
          <MagnifiedDocItem value='photos' label='Photos'>
            <ImageIcon />
          </MagnifiedDocItem>
          <MagnifiedDocItem value='music' label='Music'>
            <HeadphonesIcon />
          </MagnifiedDocItem>
        </MagnifiedDocDock>
      </MagnifiedDoc>
    </div>
  );
}
