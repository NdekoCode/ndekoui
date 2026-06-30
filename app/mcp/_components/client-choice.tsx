'use client';

import { useReducedMotion } from 'motion/react';
import { createContext, use, useCallback, useMemo, useState } from 'react';

import { clientTabIdOf, DEFAULT_CLIENT_ID, SETUP_SECTION_ID } from './clients';

type ClientChoice = {
  clientId: string;
  setClientId: (clientId: string) => void;
  /** Selects a client and brings its steps into view, for the buttons of the hero. */
  showClient: (clientId: string) => void;
};

const ClientChoiceContext = createContext<ClientChoice | null>(null);

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
  const shouldReduceMotion = useReducedMotion();

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
