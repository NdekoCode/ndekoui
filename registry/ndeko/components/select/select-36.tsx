import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

const PLANS = [
  {
    value: 'starter',
    label: 'Starter',
    description: 'For one person trying things out',
  },
  {
    value: 'pro',
    label: 'Pro',
    description: 'For freelancers and small studios',
  },
  {
    value: 'team',
    label: 'Team',
    description: 'For teams that share projects',
  },
];

export default function Select36() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Plan</FieldLabel>
      <Select items={PLANS} defaultValue='pro'>
        <SelectTrigger>
          <SelectValue placeholder='Pick a plan' />
        </SelectTrigger>
        <SelectContent>
          {PLANS.map((plan) => (
            <SelectItem
              key={plan.value}
              value={plan.value}
              label={plan.label}
              className='h-auto py-1.5'
            >
              <span className='flex min-w-0 flex-col gap-0.5'>
                <span className='truncate'>{plan.label}</span>
                <span className='text-muted-foreground truncate text-xs'>
                  {plan.description}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
