import { Magnetic } from '@/components/core/magnetic';
import { Button } from '@/registry/ndeko/ui/button';

export function MagneticNested() {
  const springOptions = { bounce: 0.1 };

  return (
    <Magnetic
      intensity={0.2}
      springOptions={springOptions}
      actionArea='global'
      range={200}
    >
      <Button variant='secondary'>
        <Magnetic
          intensity={0.1}
          springOptions={springOptions}
          actionArea='global'
          range={200}
        >
          <span>Request access</span>
        </Magnetic>
      </Button>
    </Magnetic>
  );
}
