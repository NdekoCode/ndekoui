'use client';

import { toast } from 'sonner';

import { Button } from '@/registry/ndeko/ui/button';

const RETRY_DURATION_MS = 1200;

function waitForRetry() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, RETRY_DURATION_MS);
  });
}

function retryInvite() {
  toast.promise(waitForRetry(), {
    loading: 'Sending the invite again',
    success: 'Invite sent to amara@example.com',
    error: 'The invite could not be sent',
  });
}

function showFailure() {
  toast.error('We could not send the invite', {
    description:
      'The server did not answer. Check your connection, then try again.',
    action: {
      label: 'Try again',
      onClick: retryInvite,
    },
  });
}

export default function Notification19() {
  return (
    <Button variant='outline' onClick={showFailure}>
      Show error toast
    </Button>
  );
}
