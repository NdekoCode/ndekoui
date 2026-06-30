import { Text3DFlip } from '@/components/core/text-3d-flip';
import { Button } from '@/registry/ndeko/ui/button';

const LINKS = ['Overview', 'Templates', 'Change log', 'Pricing'];

export function Text3DFlipNav() {
  return (
    <nav aria-label='Product' className='flex flex-wrap items-center gap-1'>
      {LINKS.map((label) => (
        <Button
          key={label}
          variant='ghost'
          render={<a href='#' />}
          nativeButton={false}
          className='text-muted-foreground'
        >
          <Text3DFlip backClassName='text-primary-ink'>{label}</Text3DFlip>
        </Button>
      ))}
    </nav>
  );
}
