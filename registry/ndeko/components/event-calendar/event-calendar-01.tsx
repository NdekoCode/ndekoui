'use client';

import { addDays, setHours, setMinutes, subDays } from 'date-fns';
import { useState } from 'react';

import { EventCalendar, type CalendarEvent } from './_parts';

function atTime(day: Date, hours: number, minutes: number) {
  const withHours = setHours(day, hours);
  return setMinutes(withHours, minutes);
}

function buildSampleEvents(): CalendarEvent[] {
  const today = new Date();
  return [
    {
      id: '1',
      title: 'Annual planning',
      description: 'Strategic planning for next year',
      start: subDays(today, 24),
      end: subDays(today, 23),
      allDay: true,
      color: 'info',
      location: 'Main conference hall',
    },
    {
      id: '2',
      title: 'Project deadline',
      description: 'Submit the final deliverables',
      start: atTime(subDays(today, 9), 13, 0),
      end: atTime(subDays(today, 9), 15, 30),
      color: 'warning',
      location: 'Office',
    },
    {
      id: '3',
      title: 'Quarterly budget review',
      description: 'Spending against the plan, team by team',
      start: subDays(today, 13),
      end: subDays(today, 13),
      allDay: true,
      color: 'warning',
      location: 'Main conference hall',
    },
    {
      id: '4',
      title: 'Team meeting',
      description: 'Weekly team sync',
      start: atTime(today, 10, 0),
      end: atTime(today, 11, 0),
      color: 'info',
      location: 'Conference room A',
    },
    {
      id: '5',
      title: 'Lunch with a client',
      description: 'Requirements for the new project',
      start: atTime(addDays(today, 1), 12, 0),
      end: atTime(addDays(today, 1), 13, 15),
      color: 'success',
      location: 'Downtown cafe',
    },
    {
      id: '6',
      title: 'Product launch',
      description: 'The new release goes live',
      start: addDays(today, 3),
      end: addDays(today, 6),
      allDay: true,
      color: 'primary',
    },
    {
      id: '7',
      title: 'Sales conference',
      description: 'New accounts for the coming quarter',
      start: atTime(addDays(today, 4), 14, 30),
      end: atTime(addDays(today, 5), 14, 45),
      color: 'destructive',
      location: 'Downtown cafe',
    },
    {
      id: '8',
      title: 'Team meeting',
      description: 'Weekly team sync',
      start: atTime(addDays(today, 5), 9, 0),
      end: atTime(addDays(today, 5), 10, 30),
      color: 'warning',
      location: 'Conference room A',
    },
    {
      id: '9',
      title: 'Review contracts',
      description: 'Renewals due this month',
      start: atTime(addDays(today, 5), 14, 0),
      end: atTime(addDays(today, 5), 15, 30),
      color: 'info',
      location: 'Conference room A',
    },
    {
      id: '10',
      title: 'Design critique',
      description: 'Onboarding screens, second round',
      start: atTime(addDays(today, 5), 9, 45),
      end: atTime(addDays(today, 5), 11, 0),
      color: 'warning',
      location: 'Conference room A',
    },
    {
      id: '11',
      title: 'Marketing strategy session',
      description: 'Quarterly marketing planning',
      start: atTime(addDays(today, 9), 10, 0),
      end: atTime(addDays(today, 9), 15, 30),
      color: 'success',
      location: 'Marketing department',
    },
    {
      id: '12',
      title: 'Shareholders meeting',
      description: 'Presentation of the yearly results',
      start: addDays(today, 17),
      end: addDays(today, 17),
      allDay: true,
      color: 'info',
      location: 'Grand conference center',
    },
    {
      id: '13',
      title: 'Product workshop',
      description: 'Ideas for the next features',
      start: atTime(addDays(today, 26), 9, 0),
      end: atTime(addDays(today, 27), 17, 0),
      color: 'destructive',
      location: 'Innovation lab',
    },
  ];
}

export default function EventCalendar01() {
  const [events, setEvents] = useState(buildSampleEvents);

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

  return (
    <EventCalendar
      events={events}
      onEventAdd={addEvent}
      onEventUpdate={updateEvent}
      onEventDelete={deleteEvent}
    />
  );
}
