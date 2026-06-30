'use client';

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
  type Transition,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { ArrowRightToLineIcon } from '@/registry/ndeko/lib/icons';

import { RollingCount } from './_parts/motion-parts';
import { keyOf } from './_parts/subtask-data';
import { StatusGlyph } from './_parts/subtask-parts';

type NoteLine = {
  id: string;
  text: string;
};

type ConvertedLine = NoteLine & {
  number: number;
};

const NOTES: NoteLine[] = [
  { id: 'n1', text: 'Finance wants the invoice number as the first column' },
  { id: 'n2', text: 'Amounts keep two decimals, with a dot' },
  { id: 'n3', text: 'Empty exports still download a header row' },
  { id: 'n4', text: 'Name the file after the date range' },
];

const FIRST_NUMBER = 231;

const TRAVEL: Transition = { type: 'spring', bounce: 0, duration: 0.35 };

const INSTANT: Transition = { duration: 0 };

function travelOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return TRAVEL;
}

function layoutIdOf(line: NoteLine, shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return undefined;
  }
  return `line-${line.id}`;
}

function NoteRow({
  line,
  onConvert,
}: {
  line: NoteLine;
  onConvert: (isFromKeyboard: boolean) => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.li
      layout='position'
      layoutId={layoutIdOf(line, shouldReduceMotion)}
      transition={travelOf(shouldReduceMotion)}
      className='group/row hover:bg-foreground/[0.03] flex min-h-9 items-center gap-3 rounded-lg ps-2.5 pe-1'
    >
      <span
        aria-hidden='true'
        className='bg-foreground/30 size-1 shrink-0 rounded-full'
      />
      <span className='min-w-0 flex-1 text-[13px] leading-5'>{line.text}</span>
      <button
        type='button'
        onClick={(event) => onConvert(event.detail === 0)}
        aria-label={`Make "${line.text}" a sub-task`}
        className='text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-medium opacity-0 transition-[opacity,background-color,color] outline-none group-focus-within/row:opacity-100 group-hover/row:opacity-100 focus-visible:ring-[3px] pointer-coarse:opacity-100'
      >
        <ArrowRightToLineIcon className='size-3.5 rotate-90' />
        Sub-task
      </button>
    </motion.li>
  );
}

function SubtaskRow({ line }: { line: ConvertedLine }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.li
      layout='position'
      layoutId={layoutIdOf(line, shouldReduceMotion)}
      transition={travelOf(shouldReduceMotion)}
      className='flex min-h-9 items-center gap-3 rounded-lg px-2.5'
    >
      <StatusGlyph status='todo' />
      <span className='text-muted-foreground w-16 shrink-0 text-xs tabular-nums'>
        {keyOf(line.number)}
      </span>
      <span className='min-w-0 flex-1 text-[13px] leading-5'>{line.text}</span>
    </motion.li>
  );
}

export default function Subtask07() {
  const shouldReduceMotion = useReducedMotion();
  const [notes, setNotes] = useState(NOTES);
  const [converted, setConverted] = useState<ConvertedLine[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const notesRef = useRef<HTMLUListElement>(null);
  const hasNotes = notes.length > 0;
  const hasConverted = converted.length > 0;

  useEffect(() => {
    if (focusIndex === null) {
      return;
    }
    const buttons = notesRef.current?.querySelectorAll('button');
    if (!buttons) {
      return;
    }
    const lastIndex = buttons.length - 1;
    const target = buttons[Math.min(focusIndex, lastIndex)];
    target?.focus();
  }, [focusIndex, notes]);

  function convert(line: NoteLine, isFromKeyboard: boolean) {
    const number = FIRST_NUMBER + converted.length;
    if (isFromKeyboard) {
      const index = notes.findIndex((item) => item.id === line.id);
      setFocusIndex(index);
    }
    setNotes((current) => current.filter((item) => item.id !== line.id));
    setConverted((current) => [...current, { ...line, number }]);
    setAnnouncement(`${line.text} is now sub-task ${keyOf(number)}`);
  }

  return (
    <LayoutGroup>
      <section aria-label='Notes and sub-tasks' className='w-full max-w-md'>
        <motion.h3
          layout='position'
          transition={travelOf(shouldReduceMotion)}
          className='px-2.5 text-sm font-medium'
        >
          Notes
        </motion.h3>
        <ul ref={notesRef} className='mt-1.5'>
          {notes.map((line) => (
            <NoteRow
              key={line.id}
              line={line}
              onConvert={(isFromKeyboard) => convert(line, isFromKeyboard)}
            />
          ))}
        </ul>
        <AnimatePresence initial={false}>
          {!hasNotes && (
            <motion.p
              layout='position'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='text-muted-foreground px-2.5 py-2 text-[13px]'
            >
              Every note is a sub-task now
            </motion.p>
          )}
        </AnimatePresence>
        <motion.div
          layout='position'
          transition={travelOf(shouldReduceMotion)}
          className='mt-5 flex items-baseline justify-between gap-3 px-2.5'
        >
          <h3 className='text-sm font-medium'>Sub-tasks</h3>
          <span className='text-muted-foreground text-xs'>
            <RollingCount value={converted.length} /> created from notes
          </span>
        </motion.div>
        <ul className='mt-1.5'>
          {converted.map((line) => (
            <SubtaskRow key={line.id} line={line} />
          ))}
        </ul>
        {!hasConverted && (
          <p className='hairline-border border-foreground/20 text-muted-foreground mt-1.5 rounded-lg border-dashed px-3 py-2.5 text-[13px]'>
            Turn a note into a sub-task with the button on its line
          </p>
        )}
        <p aria-live='polite' className='sr-only'>
          {announcement}
        </p>
      </section>
    </LayoutGroup>
  );
}
