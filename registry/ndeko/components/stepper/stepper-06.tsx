import { ShuffleIcon } from '@/registry/ndeko/lib/icons';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTrigger,
} from '@/registry/ndeko/ui/stepper';

const CONNECTOR = [
  'relative group-data-[state=completed]/step:bg-foreground/10',
  'after:bg-primary after:absolute after:inset-0 after:origin-left after:scale-x-0 after:rounded-full after:transition-[scale] after:duration-200 after:ease-out-strong rtl:after:origin-right',
  'group-data-[state=completed]/step:after:scale-x-100 group-data-[state=completed]/step:after:duration-300',
].join(' ');

export default function Stepper06() {
  return (
    <Stepper defaultValue={2} className='max-w-xl'>
      <StepperItem step={1} className='not-last:flex-1'>
        <StepperTrigger>
          <StepperIndicator>
            <Avatar
              className='size-6'
              seed='Mike Palmer'
              role='img'
              aria-label='Mike Palmer'
            />
          </StepperIndicator>
        </StepperTrigger>
        <StepperSeparator className={CONNECTOR} />
      </StepperItem>
      <StepperItem step={2} className='not-last:flex-1' loading>
        <StepperTrigger>
          <StepperIndicator />
        </StepperTrigger>
        <StepperSeparator className={CONNECTOR} />
      </StepperItem>
      <StepperItem step={3} className='not-last:flex-1'>
        <StepperTrigger>
          <StepperIndicator>
            <ShuffleIcon className='size-3.5' />
            <span className='sr-only'>Shuffle</span>
          </StepperIndicator>
        </StepperTrigger>
      </StepperItem>
    </Stepper>
  );
}
