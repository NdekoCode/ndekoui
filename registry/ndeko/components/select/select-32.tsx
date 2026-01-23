import { cn } from '@/registry/ndeko/lib/utils';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

type Status = {
  value: string;
  name: string;
  dotClassName: string;
};

const STATUSES: Status[] = [
  { value: 'completed', name: 'Completed', dotClassName: 'bg-success' },
  { value: 'in-progress', name: 'In progress', dotClassName: 'bg-info' },
  { value: 'pending', name: 'Pending', dotClassName: 'bg-warning' },
  {
    value: 'cancelled',
    name: 'Cancelled',
    dotClassName: 'bg-muted-foreground',
  },
  { value: 'failed', name: 'Failed', dotClassName: 'bg-destructive' },
];

function StatusName({ status }: { status: Status }) {
  return (
    <span className='flex min-w-0 items-center gap-2'>
      <span
        aria-hidden='true'
        className={cn('size-2 shrink-0 rounded-full', status.dotClassName)}
      />
      <span className='truncate'>{status.name}</span>
    </span>
  );
}

const STATUS_ITEMS = STATUSES.map((status) => ({
  value: status.value,
  label: <StatusName status={status} />,
}));

export default function Select32() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Status</FieldLabel>
      <Select items={STATUS_ITEMS} defaultValue='completed'>
        <SelectTrigger>
          <SelectValue placeholder='Pick a status' />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((status) => (
            <SelectItem
              key={status.value}
              value={status.value}
              label={status.name}
            >
              <StatusName status={status} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
