import { Magnetic } from '@/components/core/magnetic';
import { Button } from '@/registry/ndeko/ui/button';

export function MagneticBasic() {
  return (
    <Magnetic>
      <Button variant='outline'>Request access</Button>
    </Magnetic>
  );
}
