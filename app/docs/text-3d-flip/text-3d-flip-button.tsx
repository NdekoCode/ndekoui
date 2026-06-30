import { Text3DFlip } from '@/components/core/text-3d-flip';
import { Button } from '@/registry/ndeko/ui/button';

export function Text3DFlipButton() {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <Button size='lg'>
        <Text3DFlip staggerFrom='center' stagger={0.025}>
          Book a walkthrough
        </Text3DFlip>
      </Button>
      <Button size='lg' variant='outline'>
        <Text3DFlip direction='right' stagger={0.02}>
          Read the guide
        </Text3DFlip>
      </Button>
    </div>
  );
}
