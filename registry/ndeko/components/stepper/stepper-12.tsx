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

const CONNECTOR = [
  'relative group-data-[state=completed]/step:bg-foreground/10',
  'after:bg-primary after:absolute after:inset-0 after:origin-left after:scale-x-0 after:rounded-full after:transition-[scale] after:duration-200 after:ease-out-strong rtl:after:origin-right',
  'group-data-[state=completed]/step:after:scale-x-100 group-data-[state=completed]/step:after:duration-300',
].join(' ');

export default function Stepper12() {
  return (
    <Stepper defaultValue={2} className='@container'>
      {STEPS.map(({ step, title, description }) => (
        <StepperItem
          key={step}
          step={step}
          className='not-last:flex-1 @max-xl:items-start'
        >
          <StepperTrigger className='rounded-md @max-xl:flex-col'>
            <StepperIndicator />
            <div className='text-center @xl:text-left'>
              <StepperTitle>{title}</StepperTitle>
              <StepperDescription className='@max-md:hidden'>
                {description}
              </StepperDescription>
            </div>
          </StepperTrigger>
          {step < STEPS.length && (
            <StepperSeparator
              className={cn(CONNECTOR, '@max-xl:mt-3.5 @xl:mx-4')}
            />
          )}
        </StepperItem>
      ))}
    </Stepper>
  );
}
