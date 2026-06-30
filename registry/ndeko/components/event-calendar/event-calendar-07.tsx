'use client';

import { useState } from 'react';

import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import {
  DayEventsPanel,
  defaultStartOf,
  EventDialog,
  MiniMonth,
  useEventEditor,
  useEventList,
} from './_parts';
import { buildSampleEvents } from './_parts/sample-events';

export default function EventCalendar07() {
  const { events, addEvent, updateEvent, deleteEvent } =
    useEventList(buildSampleEvents);
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const editor = useEventEditor({
    events,
    onEventAdd: addEvent,
    onEventUpdate: updateEvent,
    onEventDelete: deleteEvent,
  });

  function createOnSelectedDay() {
    const start = defaultStartOf(selectedDay);
    editor.openNewEvent(start);
  }

  return (
    <div className='bg-card hairline-ring ring-border @container w-full max-w-3xl rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex flex-col gap-4 p-3 @xl:flex-row @xl:gap-6 @xl:p-4'>
        <div className='mx-auto flex w-fit shrink-0 flex-col gap-3 @xl:mx-0'>
          <MiniMonth
            events={events}
            selected={selectedDay}
            onSelect={setSelectedDay}
          />
          <Button
            variant='outline'
            className='w-full'
            onClick={createOnSelectedDay}
          >
            <PlusIcon />
            New event
          </Button>
        </div>
        <DayEventsPanel
          day={selectedDay}
          events={events}
          onEventSelect={editor.openEvent}
          className='min-w-0 flex-1 @xl:pt-1.5'
        />
      </div>
      <EventDialog {...editor.dialogProps} />
    </div>
  );
}
