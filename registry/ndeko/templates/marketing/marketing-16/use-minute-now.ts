'use client';

import { useEffect, useState } from 'react';

const MINUTE_MS = 60000;

const ALIGN_MS = 50;

function untilNextMinute() {
  return MINUTE_MS - (Date.now() % MINUTE_MS) + ALIGN_MS;
}

export function useMinuteNow(isActive: boolean) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!isActive) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;

    function tick() {
      setNow(Date.now());
      timer = setTimeout(tick, untilNextMinute());
    }

    timer = setTimeout(tick, 0);
    return () => clearTimeout(timer);
  }, [isActive]);

  return now;
}
