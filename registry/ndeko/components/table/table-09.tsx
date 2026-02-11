import { Badge } from '@/registry/ndeko/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/registry/ndeko/ui/table';

const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const ROW =
  '*:border-border [&>:not(:last-child)]:hairline-r hover:bg-transparent';

const KEY_CELL =
  'bg-foreground/[0.025] text-foreground h-auto w-32 py-2 text-[13px] font-medium';

export default function Table09() {
  return (
    <div className='bg-card hairline-ring ring-border mx-auto w-full max-w-lg overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <Table>
        <TableBody>
          <TableRow className={ROW}>
            <TableHead scope='row' className={KEY_CELL}>
              Name
            </TableHead>
            <TableCell className='py-2'>Kenji Watanabe</TableCell>
          </TableRow>
          <TableRow className={ROW}>
            <TableHead scope='row' className={KEY_CELL}>
              Email
            </TableHead>
            <TableCell className='py-2'>kenji.watanabe@example.com</TableCell>
          </TableRow>
          <TableRow className={ROW}>
            <TableHead scope='row' className={KEY_CELL}>
              Location
            </TableHead>
            <TableCell className='py-2'>Osaka, Japan</TableCell>
          </TableRow>
          <TableRow className={ROW}>
            <TableHead scope='row' className={KEY_CELL}>
              Status
            </TableHead>
            <TableCell className='py-2'>
              <Badge variant='success'>Active</Badge>
            </TableCell>
          </TableRow>
          <TableRow className={ROW}>
            <TableHead scope='row' className={KEY_CELL}>
              Balance
            </TableHead>
            <TableCell className='py-2 tabular-nums'>
              {CURRENCY.format(1000)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
