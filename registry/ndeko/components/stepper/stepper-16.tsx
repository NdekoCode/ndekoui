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
  { step: 4, title: 'Choose plan' },
];

const SEPARATOR =
  'absolute inset-y-0 top-[calc(1.5rem+0.125rem)] left-3 -order-1 m-0 -translate-x-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none group-data-[orientation=vertical]/stepper:h-[calc(100%-1.5rem-0.25rem)]';

const CONNECTOR = [
  'relative group-data-[state=completed]/step:bg-foreground/10',
  'after:bg-primary after:absolute after:inset-0 after:origin-top after:scale-y-0 after:rounded-full after:transition-[scale] after:duration-200 after:ease-out-strong',
  'group-data-[state=completed]/step:after:scale-y-100 group-data-[state=completed]/step:after:duration-300',
].join(' ');

export default function Stepper16() {
  return (
    <Stepper defaultValue={2} orientation='vertical'>
      {STEPS.map(({ step, title }) => (
        <StepperItem
          key={step}
          step={step}
          className='relative items-start not-last:flex-1'
        >
          <StepperTrigger className='items-start rounded-md pb-12 last:pb-0'>
            <StepperIndicator />
            <div className='mt-0.5 px-2 text-left'>
              <StepperTitle>{title}</StepperTitle>
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
