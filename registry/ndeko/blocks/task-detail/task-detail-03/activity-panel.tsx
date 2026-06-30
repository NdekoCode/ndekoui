import type { WorkEvent } from './data';
import { EventGlyph } from './work-glyphs';
import { actorNameOf, clockOf, eventDaysOf } from './work-model';

function EventRow({ event }: { event: WorkEvent }) {
  return (
    <li className='flex gap-3 py-1.5'>
      <EventGlyph kind={event.kind} />
      <p className='text-muted-foreground min-w-0 flex-1 pt-0.5 text-[13px] leading-5'>
        <span className='text-foreground font-medium'>
          {actorNameOf(event.actorId)}
        </span>{' '}
        {event.text}
        <time dateTime={event.at} className='ms-2 text-xs tabular-nums'>
          {clockOf(event.at)}
        </time>
      </p>
    </li>
  );
}

export function ActivityPanel({ events }: { events: WorkEvent[] }) {
  const days = eventDaysOf(events);

  return (
    <div className='flex flex-col gap-2'>
      {days.map((day) => (
        <section key={day.key} aria-label={day.label}>
          <h4 className='text-muted-foreground pb-1 text-xs font-medium'>
            {day.label}
          </h4>
          <ul>
            {day.events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
