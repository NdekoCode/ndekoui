'use client';

import { addHours, format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';

import type { CalendarEvent } from './types';
import { clockLabelOf, snapToQuarterHour } from './utils';

type EditorDialog = {
  isOpen: boolean;
  event: CalendarEvent | null;
  session: number;
};

const IDLE_DIALOG: EditorDialog = { isOpen: false, event: null, session: 0 };

export type EventEditorOptions = {
  events: CalendarEvent[];
  onEventAdd?: (event: CalendarEvent) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
};

export type EventEditor = {
  /** Spread on `EventDialog`. */
  dialogProps: {
    event: CalendarEvent | null;
    isOpen: boolean;
    session: number;
    onClose: () => void;
    onSave: (event: CalendarEvent) => void;
    onDelete: (eventId: string) => void;
  };
  openEvent: (event: CalendarEvent) => void;
  openNewEvent: (startTime: Date) => void;
  moveEvent: (event: CalendarEvent) => void;
};

type UndoAction = {
  label: string;
  onClick: () => void;
};

function newEventId() {
  return Math.random().toString(36).substring(2, 11);
}

function draftAt(startTime: Date): CalendarEvent {
  const start = snapToQuarterHour(startTime);
  const end = addHours(start, 1);
  return { id: '', title: '', start, end, allDay: false };
}

function whenOf(event: CalendarEvent) {
  const start = new Date(event.start);
  const day = format(start, 'EEE, MMM d');
  if (event.allDay) {
    return day;
  }
  return `${day}, ${clockLabelOf(start)}`;
}

function notify(message: string, event: CalendarEvent, undo?: () => void) {
  let action: UndoAction | undefined;
  if (undo) {
    action = { label: 'Undo', onClick: undo };
  }
  toast(message, {
    description: whenOf(event),
    action,
    position: 'bottom-left',
  });
}

/**
 * The state behind the event dialog: which event is open, and what saving, deleting and
 * moving do, each confirmed by a toast. Deleting and moving can be undone from the toast.
 */
export function useEventEditor({
  events,
  onEventAdd,
  onEventUpdate,
  onEventDelete,
}: EventEditorOptions): EventEditor {
  const [dialog, setDialog] = useState<EditorDialog>(IDLE_DIALOG);

  function open(event: CalendarEvent | null) {
    setDialog((current) => ({
      isOpen: true,
      event,
      session: current.session + 1,
    }));
  }

  function close() {
    setDialog((current) => ({ ...current, isOpen: false }));
  }

  function openEvent(event: CalendarEvent) {
    open(event);
  }

  function openNewEvent(startTime: Date) {
    open(draftAt(startTime));
  }

  function save(event: CalendarEvent) {
    if (event.id) {
      onEventUpdate?.(event);
      notify(`Saved "${event.title}"`, event);
    } else {
      onEventAdd?.({ ...event, id: newEventId() });
      notify(`Added "${event.title}"`, event);
    }
    close();
  }

  function remove(eventId: string) {
    const deletedEvent = events.find((event) => event.id === eventId);
    onEventDelete?.(eventId);
    close();
    if (!deletedEvent) {
      return;
    }
    let undo: (() => void) | undefined;
    if (onEventAdd) {
      undo = () => onEventAdd(deletedEvent);
    }
    notify(`Deleted "${deletedEvent.title}"`, deletedEvent, undo);
  }

  function moveEvent(movedEvent: CalendarEvent) {
    const originalEvent = events.find((event) => event.id === movedEvent.id);
    onEventUpdate?.(movedEvent);
    let undo: (() => void) | undefined;
    if (originalEvent && onEventUpdate) {
      undo = () => onEventUpdate(originalEvent);
    }
    notify(`Moved "${movedEvent.title}"`, movedEvent, undo);
  }

  return {
    dialogProps: {
      event: dialog.event,
      isOpen: dialog.isOpen,
      session: dialog.session,
      onClose: close,
      onSave: save,
      onDelete: remove,
    },
    openEvent,
    openNewEvent,
    moveEvent,
  };
}
