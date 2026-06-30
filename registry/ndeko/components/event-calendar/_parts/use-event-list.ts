'use client';

import { useState } from 'react';

import type { CalendarEvent } from './types';

/** Events kept in local state, with the three handlers the calendar calls. */
export function useEventList(initialEvents: () => CalendarEvent[]) {
  const [events, setEvents] = useState(initialEvents);

  function addEvent(event: CalendarEvent) {
    setEvents((current) => [...current, event]);
  }

  function updateEvent(updatedEvent: CalendarEvent) {
    setEvents((current) =>
      current.map((event) => {
        if (event.id === updatedEvent.id) {
          return updatedEvent;
        }
        return event;
      })
    );
  }

  function deleteEvent(eventId: string) {
    setEvents((current) => current.filter((event) => event.id !== eventId));
  }

  return { events, addEvent, updateEvent, deleteEvent };
}
