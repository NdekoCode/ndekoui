import { cn } from '@/registry/ndeko/lib/utils';
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/registry/ndeko/ui/stepper';

const STEPS = [
  { step: 1, title: 'Account', description: 'Your name and email' },
  { step: 2, title: 'Workspace', description: 'Name and web address' },
  { step: 3, title: 'Invite team', description: 'Add a few teammates' },
];

const SEPARATOR =
  'absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none';

const CONNECTOR = [
  'relative group-data-[state=completed]/step:bg-foreground/10',
  'after:bg-primary after:absolute after:inset-0 after:origin-left after:scale-x-0 after:rounded-full after:transition-[scale] after:duration-200 after:ease-out-strong rtl:after:origin-right',
  'group-data-[state=completed]/step:after:scale-x-100 group-data-[state=completed]/step:after:duration-300',
].join(' ');

export default function Stepper10() {
  return (
    <Stepper defaultValue={2}>
      {STEPS.map(({ step, title, description }) => (
        <StepperItem
          key={step}
          step={step}
          className='relative flex-1 flex-col!'
        >
          <StepperTrigger className='flex-col gap-3 rounded-md text-center'>
            <StepperIndicator />
            <div className='flex flex-col gap-0.5 px-2'>
              <StepperTitle>{title}</StepperTitle>
              <StepperDescription>{description}</StepperDescription>
            </div>
          </StepperTrigger>
          {step < STEPS.length && (
            <StepperSeparator className={cn(CONNECTOR, SEPARATOR)} />
          )}
        </StepperItem>
      ))}
    </Stepper>
  );
}
