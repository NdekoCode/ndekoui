import { SpinningText } from '@/components/core/spinning-text';
import { UsersIcon } from '@/registry/ndeko/lib/icons';

const COHORT = 'Spring cohort';

const SEATS_LEFT = '12';

export function SpinningTextReverse() {
  return (
    <div className='grid size-40 place-items-center'>
      <SpinningText
        reverse
        duration={16}
        radius={6.5}
        fontSize={0.8}
        className='text-muted-foreground col-start-1 row-start-1 font-medium'
      >
        {COHORT} • {SEATS_LEFT} seats left •{' '}
      </SpinningText>
      <span className='gem-plate col-start-1 row-start-1 grid size-14 place-items-center rounded-full [--gem:var(--primary)]'>
        <UsersIcon aria-hidden='true' className='size-6' />
      </span>
    </div>
  );
}
