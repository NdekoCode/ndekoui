'use client';

import Script from 'next/script';
import { useSyncExternalStore } from 'react';

const WEBSITE_ID = '17e8fc96-321d-43a6-94e7-d571c4c66a04';

/** Visits are counted on the published site only, never on a local or a preview build. */
const COUNTED_HOST = 'ui.ndekocode.dev';

function subscribe() {
  return () => {};
}

function isTopWindow() {
  return window.self === window.top;
}

function isTopWindowOnServer() {
  return false;
}

/** A preview is a page inside the page: only the window a person opened counts as a visit. */
export function Analytics() {
  const isCounted = useSyncExternalStore(
    subscribe,
    isTopWindow,
    isTopWindowOnServer
  );
  if (!isCounted) {
    return null;
  }
  return (
    <Script
      async
      src='https://analytics.umami.is/script.js'
      data-website-id={WEBSITE_ID}
      data-domains={COUNTED_HOST}
    />
  );
}
