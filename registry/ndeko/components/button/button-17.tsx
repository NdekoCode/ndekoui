import { Avatar, AvatarFallback } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';

export default function Button17() {
  return (
    <Button className='ps-1'>
      <Avatar className='size-6 text-[10px]'>
        <AvatarFallback>LM</AvatarFallback>
      </Avatar>
      @lena.moss
    </Button>
  );
}
