'use client';
import { useReducedMotion } from 'motion/react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { WordRoll } from '@/components/core/word-roll';

type Office = {
  city: string;
  utcOffsetMinutes: number;
};

const OFFICES: Office[] = [
  { city: 'Lindmere', utcOffsetMinutes: 0 },
  { city: 'Port Avelin', utcOffsetMinutes: 180 },
  { city: 'Tavaro', utcOffsetMinutes: 480 },
];

const ROTATE_MS = 4000;

const MINUTE_MS = 60_000;

const MINUTES_PER_HOUR = 60;

const MINUTES_PER_DAY = 1440;

const WIDEST_TIME = '00:00';

const CLOCK_LABELS = OFFICES.map((office) => `${office.city} ${WIDEST_TIME}`);

/** Timers are throttled in a hidden tab, so the clock also reads the time again when the tab comes back. */
function subscribeToMinutes(onChange: () => void) {
  const intoMinute = Date.now() % MINUTE_MS;
  const untilNextMinute = MINUTE_MS - intoMinute;
  let interval: number | undefined;
  const timeout = window.setTimeout(() => {
    onChange();
    interval = window.setInterval(onChange, MINUTE_MS);
  }, untilNextMinute);
  document.addEventListener('visibilitychange', onChange);
  return () => {
    window.clearTimeout(timeout);
    window.clearInterval(interval);
    document.removeEventListener('visibilitychange', onChange);
  };
}

function currentMinute() {
  const elapsedMinutes = Date.now() / MINUTE_MS;
  return Math.floor(elapsedMinutes);
}

function serverMinute() {
  return null;
}

function twoDigits(value: number) {
  const text = String(value);
  return text.padStart(2, '0');
}

function timeAt(minute: number, office: Office) {
  const utcMinuteOfDay = minute % MINUTES_PER_DAY;
  const shifted = utcMinuteOfDay + office.utcOffsetMinutes;
  const wrapped = shifted + MINUTES_PER_DAY;
  const localMinute = wrapped % MINUTES_PER_DAY;
  const hours = Math.floor(localMinute / MINUTES_PER_HOUR);
  const minutes = localMinute % MINUTES_PER_HOUR;
  const hoursText = twoDigits(hours);
  const minutesText = twoDigits(minutes);
  return `${hoursText}:${minutesText}`;
}

function nextOfficeOf(index: number) {
  const next = index + 1;
  return next % OFFICES.length;
}

function spokenClockOf(minute: number) {
  const times = OFFICES.map((office) => {
    const time = timeAt(minute, office);
    return `${office.city} ${time}`;
  });
  const list = times.join(', ');
  return `Team hours: ${list}`;
}

function ClockPlaceholder() {
  return (
    <span aria-hidden='true' className='inline-grid'>
      {CLOCK_LABELS.map((label) => (
        <span key={label} className='invisible col-start-1 row-start-1'>
          {label}
        </span>
      ))}
    </span>
  );
}

export function WordRollClock() {
  const shouldReduceMotion = useReducedMotion();
  const minute = useSyncExternalStore(
    subscribeToMinutes,
    currentMinute,
    serverMinute
  );
  const [officeIndex, setOfficeIndex] = useState(0);
  const office = OFFICES[officeIndex];

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }
    const interval = window.setInterval(() => {
      setOfficeIndex(nextOfficeOf);
    }, ROTATE_MS);
    return () => window.clearInterval(interval);
  }, [shouldReduceMotion]);

  if (minute === null) {
    return (
      <div className='bg-card hairline-ring ring-border flex w-full max-w-sm items-baseline gap-1.5 rounded-xl px-4 py-3 text-[13px] shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <span className='font-medium'>Remote team</span>
        <span aria-hidden='true' className='text-foreground/30'>
          ·
        </span>
        <ClockPlaceholder />
      </div>
    );
  }

  const time = timeAt(minute, office);
  const spokenClock = spokenClockOf(minute);

  return (
    <div className='bg-card hairline-ring ring-border flex w-full max-w-sm items-baseline gap-1.5 rounded-xl px-4 py-3 text-[13px] shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <span className='font-medium'>Remote team</span>
      <span aria-hidden='true' className='text-foreground/30'>
        ·
      </span>
      <WordRoll
        text={`${office.city} ${time}`}
        labels={CLOCK_LABELS}
        accessibleText={spokenClock}
        className='text-muted-foreground tabular-nums'
      />
    </div>
  );
}
