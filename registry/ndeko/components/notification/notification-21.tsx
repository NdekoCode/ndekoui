'use client';

import { toast } from 'sonner';

import { Button } from '@/registry/ndeko/ui/button';

function undoMove() {
  toast('Task moved back to In review');
}

function showTaskMoved() {
  toast('Task moved to Done', {
    description: 'Design review, in Atlas Redesign',
    action: {
      label: 'Undo',
      onClick: undoMove,
    },
  });
}

export default function Notification21() {
  return (
    <Button variant='outline' onClick={showTaskMoved}>
      Show toast with undo
    </Button>
  );
}
