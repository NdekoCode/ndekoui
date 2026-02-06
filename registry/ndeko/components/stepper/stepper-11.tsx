import { cn } from '@/registry/ndeko/lib/utils';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/registry/ndeko/ui/stepper';

const STEPS = [
  { step: 1, title: 'Account' },
  { step: 2, title: 'Workspace' },
  { step: 3, title: 'Invite team' },
];

const CONNECTOR = [
  'relative group-data-[state=completed]/step:bg-foreground/10',
  'after:bg-primary after:absolute after:inset-0 after:origin-left after:scale-x-0 after:rounded-full after:transition-[scale] after:duration-200 after:ease-out-strong rtl:after:origin-right',
  'group-data-[state=completed]/step:after:scale-x-100 group-data-[state=completed]/step:after:duration-300',
].join(' ');

export default function Stepper11() {
  return (
    <Stepper defaultValue={2} className='@container'>
      {STEPS.map(({ step, title }) => (
        <StepperItem
          key={step}
          step={step}
          className='not-last:flex-1 @max-lg:items-start'
        >
          <StepperTrigger className='rounded-md @max-lg:flex-col'>
            <StepperIndicator />
            <div className='text-center @lg:text-left'>
              <StepperTitle>{title}</StepperTitle>
            </div>
          </StepperTrigger>
          {step < STEPS.length && (
            <StepperSeparator
              className={cn(CONNECTOR, '@max-lg:mt-3.5 @lg:mx-4')}
            />
          )}
        </StepperItem>
      ))}
    </Stepper>
  );
}
