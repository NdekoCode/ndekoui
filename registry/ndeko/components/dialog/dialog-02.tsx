import { Trash2Icon } from '@/registry/ndeko/lib/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/registry/ndeko/ui/alert-dialog';
import { Button } from '@/registry/ndeko/ui/button';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

export default function Dialog02() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant='outline' />}>
        Delete account
      </AlertDialogTrigger>
      <AlertDialogContent>
        <div className='flex flex-col gap-4 max-sm:items-center max-sm:text-center sm:flex-row'>
          <StatusOrb tone='error' glyph={<Trash2Icon strokeWidth={2.25} />} />
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Your profile, your 3 workspaces and every file you uploaded are
              removed for good. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant='destructive'>
            Delete account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
