import { cn } from '@/registry/ndeko/lib/utils';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperTitle,
  StepperTrigger,
} from '@/registry/ndeko/ui/stepper';

const STEPS = [
  { step: 1, title: 'Account' },
  { step: 2, title: 'Workspace' },
  { step: 3, title: 'Invite team' },
  { step: 4, title: 'Choose plan' },
];

const BAR = [
  'bg-foreground/10 data-[state=active]:bg-foreground/10 data-[state=completed]:bg-foreground/10 w-full',
  'after:bg-primary after:absolute after:inset-0 after:origin-left after:scale-x-0 after:rounded-[inherit] after:transition-[scale] after:duration-200 after:ease-out-strong rtl:after:origin-right',
  'data-[state=active]:after:scale-x-100 data-[state=active]:after:duration-300 data-[state=completed]:after:scale-x-100 data-[state=completed]:after:duration-300',
].join(' ');

export default function Stepper07() {
  return (
    <Stepper defaultValue={2} className='max-w-xl items-start gap-4'>
      {STEPS.map(({ step, title }) => (
        <StepperItem key={step} step={step} className='flex-1'>
          <StepperTrigger className='w-full flex-col items-start gap-2 rounded-md'>
            <StepperIndicator className={cn(BAR, 'h-1')}>
              <span className='sr-only'>{step}</span>
            </StepperIndicator>
            <StepperTitle>{title}</StepperTitle>
          </StepperTrigger>
        </StepperItem>
      ))}
    </Stepper>
  );
}
