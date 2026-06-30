import { useSyncExternalStore } from 'react';

function subscribeToNothing() {
  return () => {};
}

function isOnClient() {
  return true;
}

function isOnServer() {
  return false;
}

export function useIsClient() {
  return useSyncExternalStore(subscribeToNothing, isOnClient, isOnServer);
}
