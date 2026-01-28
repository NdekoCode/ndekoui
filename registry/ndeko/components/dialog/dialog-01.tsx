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

export default function Dialog01() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant='outline' />}>
        Send invoice
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send invoice INV-2041?</AlertDialogTitle>
          <AlertDialogDescription>
            Fernhill Studio receives it by email and can pay online right away.
            You can still edit it until it is paid.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Send invoice</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
