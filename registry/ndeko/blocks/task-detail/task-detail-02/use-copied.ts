'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const COPIED_FOR_MS = 1600;

export function useCopied() {
  const [isCopied, setIsCopied] = useState(false);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      toast.error('Couldn’t copy', {
        description:
          'The browser blocked the clipboard, copy it from the address bar instead',
      });
      return;
    }
    setIsCopied(true);
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
    const timer = setTimeout(() => setIsCopied(false), COPIED_FOR_MS);
    timers.current.add(timer);
  }

  return { isCopied, copy };
}

export async function copyWithToast(text: string, confirmation: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    toast.error('Couldn’t copy', {
      description: 'The browser blocked the clipboard, try again from the menu',
    });
    return;
  }
  toast.success(confirmation);
}
