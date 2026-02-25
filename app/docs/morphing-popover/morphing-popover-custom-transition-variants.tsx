import {
  MorphingPopover,
  MorphingPopoverContent,
  MorphingPopoverTrigger,
} from '@/components/core/morphing-popover';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import * as motion from 'motion/react-client';

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const;

export function MorphingPopoverCustomTransitionVariants() {
  return (
    <MorphingPopover
      variants={{
        initial: { opacity: 0, filter: 'blur(10px)' },
        animate: { opacity: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, filter: 'blur(10px)' },
      }}
      transition={{
        duration: 0.25,
        ease: EASE_OUT_STRONG,
      }}
    >
      <MorphingPopoverTrigger asChild>
        <Button variant='outline'>
          <motion.span
            layoutId='morphing-popover-custom-transition-variants-label'
            layout='position'
            className='inline-block'
          >
            Open popover
          </motion.span>
        </Button>
      </MorphingPopoverTrigger>
      <MorphingPopoverContent className='w-80 p-4'>
        <div className='grid gap-4'>
          <div className='space-y-2'>
            <motion.h4
              layoutId='morphing-popover-custom-transition-variants-label'
              layout='position'
              className='text-foreground text-sm leading-none font-medium'
            >
              Dimensions
            </motion.h4>
            <p className='text-muted-foreground text-[13px]'>
              Set the dimensions for the layer.
            </p>
          </div>
          <div className='grid gap-2'>
            <div className='grid grid-cols-3 items-center gap-4'>
              <Label htmlFor='width'>Width</Label>
              <Input
                id='width'
                defaultValue='100%'
                className='col-span-2'
                autoFocus
              />
            </div>
            <div className='grid grid-cols-3 items-center gap-4'>
              <Label htmlFor='maxWidth'>Max. width</Label>
              <Input
                id='maxWidth'
                defaultValue='300px'
                className='col-span-2'
              />
            </div>
            <div className='grid grid-cols-3 items-center gap-4'>
              <Label htmlFor='height'>Height</Label>
              <Input id='height' defaultValue='25px' className='col-span-2' />
            </div>
            <div className='grid grid-cols-3 items-center gap-4'>
              <Label htmlFor='maxHeight'>Max. height</Label>
              <Input
                id='maxHeight'
                defaultValue='none'
                className='col-span-2'
              />
            </div>
          </div>
        </div>
      </MorphingPopoverContent>
    </MorphingPopover>
  );
}
