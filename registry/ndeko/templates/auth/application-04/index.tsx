'use client';

import { useState } from 'react';

import { AuthFrame, StepSwap } from './auth-kit';
import { ResetFlow } from './reset-flow';
import { SignInFlow } from './sign-in-flow';
import { SignUpFlow } from './sign-up-flow';

type Flow = 'sign-in' | 'sign-up' | 'reset';

const FOOTERS: Record<Flow, string> = {
  'sign-in':
    'Trouble signing in? A workspace admin can send you a new invitation.',
  'sign-up':
    'By creating an account you accept the terms of service and the privacy notice',
  reset:
    'For your safety, this page never says whether an account uses an address',
};

export default function Application04() {
  const [flow, setFlow] = useState<Flow>('sign-in');
  const [hasMoved, setHasMoved] = useState(false);

  function open(nextFlow: Flow) {
    setFlow(nextFlow);
    setHasMoved(true);
  }

  function openSignIn() {
    open('sign-in');
  }

  function openSignUp() {
    open('sign-up');
  }

  function openReset() {
    open('reset');
  }

  return (
    <AuthFrame footer={FOOTERS[flow]}>
      <StepSwap stepKey={flow}>
        {flow === 'sign-in' && (
          <SignInFlow
            startsFocused={hasMoved}
            onCreateAccount={openSignUp}
            onForgotPassword={openReset}
          />
        )}
        {flow === 'sign-up' && (
          <SignUpFlow startsFocused={hasMoved} onSignIn={openSignIn} />
        )}
        {flow === 'reset' && (
          <ResetFlow startsFocused={hasMoved} onSignIn={openSignIn} />
        )}
      </StepSwap>
    </AuthFrame>
  );
}
