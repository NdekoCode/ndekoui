'use client';

import { EventCalendar, useEventList } from './_parts';
import { buildSampleEvents } from './_parts/sample-events';

export default function EventCalendar02() {
  const { events, addEvent, updateEvent, deleteEvent } =
    useEventList(buildSampleEvents);

  return (
    <EventCalendar
      views={['month']}
      events={events}
      onEventAdd={addEvent}
      onEventUpdate={updateEvent}
      onEventDelete={deleteEvent}
    />
  );
}
