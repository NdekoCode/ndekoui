'use client';

import { useEffect, useRef, useState } from 'react';

export type CopyStatus = 'idle' | 'copied' | 'failed';

const RESET_AFTER_MS = 1600;

export function useCopied() {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  function showFor(nextStatus: CopyStatus) {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    setStatus(nextStatus);
    timer.current = setTimeout(() => setStatus('idle'), RESET_AFTER_MS);
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      showFor('failed');
      return;
    }
    showFor('copied');
  }

  return { status, copy };
}
