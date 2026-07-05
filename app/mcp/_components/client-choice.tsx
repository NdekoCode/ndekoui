'use client';

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

import {
  CLIENTS,
  clientTabIdOf,
  DEFAULT_CLIENT_ID,
  SETUP_SECTION_ID,
} from './clients';

type ClientChoice = {
  clientId: string;
  setClientId: (clientId: string) => void;
  /** Selects a client and brings its steps into view, for the buttons of the hero. */
  showClient: (clientId: string) => void;
};

const ClientChoiceContext = createContext<ClientChoice | null>(null);

const CLIENT_PARAM = 'client';

const ARRIVAL_DELAY_MS = 300;

/** The client named in the address (`?client=cursor`, from the home page), when it is one we list. */
function requestedClientId() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get(CLIENT_PARAM);
  const isListed = CLIENTS.some((client) => client.id === requested);
  if (!isListed) {
    return null;
  }
  return requested;
}

function scrollBehaviourOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 'auto' as const;
  }
  return 'smooth' as const;
}

export function ClientChoiceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [clientId, setClientId] = useState(DEFAULT_CLIENT_ID);
  const shouldReduceMotion = usePrefersReducedMotion();

  const showClient = useCallback(
    (nextClientId: string) => {
      setClientId(nextClientId);
      const section = document.getElementById(SETUP_SECTION_ID);
      const behavior = scrollBehaviourOf(shouldReduceMotion);
      section?.scrollIntoView({ behavior, block: 'start' });
      const tabId = clientTabIdOf(nextClientId);
      const tab = document.getElementById(tabId);
      tab?.focus({ preventScroll: true });
    },
    [shouldReduceMotion]
  );

  useEffect(() => {
    const requested = requestedClientId();
    if (!requested) {
      return;
    }
    const clientId = requested;
    function showRequestedClient() {
      showClient(clientId);
    }
    // After the router's own scroll handling on arrival, or it would undo the scroll to the steps.
    const timer = window.setTimeout(showRequestedClient, ARRIVAL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [showClient]);

  const choice = useMemo(
    () => ({ clientId, setClientId, showClient }),
    [clientId, showClient]
  );

  return <ClientChoiceContext value={choice}>{children}</ClientChoiceContext>;
}

export function useClientChoice() {
  const choice = use(ClientChoiceContext);
  if (!choice) {
    throw new Error('useClientChoice needs a ClientChoiceProvider above it');
  }
  return choice;
}
