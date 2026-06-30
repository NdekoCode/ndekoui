'use client';

import { EventCalendar, useEventList } from './_parts';
import { buildSampleEvents } from './_parts/sample-events';

export default function EventCalendar03() {
  const { events, addEvent, updateEvent, deleteEvent } =
    useEventList(buildSampleEvents);

  return (
    <EventCalendar
      views={['week']}
      events={events}
      onEventAdd={addEvent}
      onEventUpdate={updateEvent}
      onEventDelete={deleteEvent}
    />
  );
}
