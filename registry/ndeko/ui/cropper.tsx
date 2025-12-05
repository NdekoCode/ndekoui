'use client';

import { Cropper as CropperPrimitive } from '@origin-space/image-cropper';

import { cn } from '@/registry/ndeko/lib/utils';

function Cropper({
  className,
  ...props
}: React.ComponentProps<typeof CropperPrimitive.Root>) {
  return (
    <CropperPrimitive.Root
      data-slot='cropper'
      className={cn(
        'bg-foreground/[0.04] focus-visible:ring-ring/25 relative flex w-full cursor-move touch-none items-center justify-center overflow-hidden rounded-xl outline-none focus-visible:ring-[3px]',
        className
      )}
      {...props}
    />
  );
}

function CropperDescription({
  className,
  ...props
}: React.ComponentProps<typeof CropperPrimitive.Description>) {
  return (
    <CropperPrimitive.Description
      data-slot='cropper-description'
      className={cn('sr-only', className)}
      {...props}
    />
  );
}

function CropperImage({
  className,
  ...props
}: React.ComponentProps<typeof CropperPrimitive.Image>) {
  return (
    <CropperPrimitive.Image
      data-slot='cropper-image'
      className={cn(
        'pointer-events-none h-full w-full object-cover',
        className
      )}
      {...props}
    />
  );
}

function CropperCropArea({
  className,
  ...props
}: React.ComponentProps<typeof CropperPrimitive.CropArea>) {
  return (
    <CropperPrimitive.CropArea
      data-slot='cropper-crop-area'
      className={cn(
        'pointer-events-none absolute border-2 border-white shadow-[0_0_0_9999px_rgb(0_0_0/0.35)] in-[[data-slot=cropper]:focus-visible]:ring-[3px] in-[[data-slot=cropper]:focus-visible]:ring-white/50',
        className
      )}
      {...props}
    />
  );
}

export { Cropper, CropperCropArea, CropperDescription, CropperImage };
