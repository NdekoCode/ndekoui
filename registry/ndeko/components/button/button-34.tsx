import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

const ITEM =
  'rounded-none first:rounded-s-md last:rounded-e-md focus-visible:z-10';

export default function Button34() {
  return (
    <ToggleGroup
      variant='outline'
      aria-label='Text alignment'
      className='gap-0 -space-x-px'
    >
      <ToggleGroupItem value='left' className={ITEM}>
        Left
      </ToggleGroupItem>
      <ToggleGroupItem value='center' className={ITEM}>
        Center
      </ToggleGroupItem>
      <ToggleGroupItem value='right' className={ITEM}>
        Right
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
