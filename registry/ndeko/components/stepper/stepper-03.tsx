import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTrigger,
} from '@/registry/ndeko/ui/stepper';

const STEPS = [1, 2, 3, 4];

const DOT = [
  'size-4 transition-[color,background-color,box-shadow] [&_span]:sr-only [&_svg]:size-3',
  'data-[state=active]:ring-primary data-[state=active]:bg-transparent data-[state=active]:ring-2 data-[state=active]:ring-inset',
].join(' ');

const CONNECTOR = [
  'relative group-data-[state=completed]/step:bg-foreground/10',
  'after:bg-primary after:absolute after:inset-0 after:origin-left after:scale-x-0 after:rounded-full after:transition-[scale] after:duration-200 after:ease-out-strong rtl:after:origin-right',
  'group-data-[state=completed]/step:after:scale-x-100 group-data-[state=completed]/step:after:duration-300',
].join(' ');

export default function Stepper03() {
  return (
    <Stepper defaultValue={2} className='max-w-xl'>
      {STEPS.map((step) => (
        <StepperItem key={step} step={step} className='not-last:flex-1'>
          <StepperTrigger>
            <StepperIndicator className={DOT} />
          </StepperTrigger>
          {step < STEPS.length && <StepperSeparator className={CONNECTOR} />}
        </StepperItem>
      ))}
    </Stepper>
  );
}
