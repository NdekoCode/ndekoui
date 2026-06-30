'use client';

import { EventCalendar, useEventList } from './_parts';
import { buildSampleEvents } from './_parts/sample-events';

export default function EventCalendar01() {
  const { events, addEvent, updateEvent, deleteEvent } =
    useEventList(buildSampleEvents);

  return (
    <EventCalendar
      events={events}
      onEventAdd={addEvent}
      onEventUpdate={updateEvent}
      onEventDelete={deleteEvent}
    />
  );
}
