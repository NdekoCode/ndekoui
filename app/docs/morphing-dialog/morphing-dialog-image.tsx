'use client';
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogClose,
  MorphingDialogImage,
  MorphingDialogContainer,
} from '@/components/core/morphing-dialog';
import { XIcon } from '@/registry/ndeko/lib/icons';
import { buttonVariants } from '@/registry/ndeko/ui/button';
import { cn } from '@/registry/ndeko/lib/utils';

const EASE_IN_OUT_STRONG = [0.77, 0, 0.175, 1] as const;

const PRIMARY_TOKEN = 'hsl(239 84% 67%)';

const POSTER_ALT =
  'Poster for the Harbor Lane night market, drawn as a moon, a pier and three stalls in flat shapes.';

function drawPoster() {
  const shapes = [
    "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'>",
    `<rect width='400' height='500' fill='${PRIMARY_TOKEN}' fill-opacity='0.12'/>`,
    `<circle cx='290' cy='120' r='56' fill='${PRIMARY_TOKEN}' fill-opacity='0.9'/>`,
    `<rect x='0' y='330' width='400' height='170' fill='${PRIMARY_TOKEN}' fill-opacity='0.22'/>`,
    `<rect x='40' y='300' width='320' height='16' rx='8' fill='${PRIMARY_TOKEN}'/>`,
    `<rect x='64' y='250' width='64' height='50' rx='6' fill='${PRIMARY_TOKEN}' fill-opacity='0.6'/>`,
    `<rect x='168' y='236' width='64' height='64' rx='6' fill='${PRIMARY_TOKEN}' fill-opacity='0.75'/>`,
    `<rect x='272' y='256' width='64' height='44' rx='6' fill='${PRIMARY_TOKEN}' fill-opacity='0.6'/>`,
    `<rect x='40' y='400' width='180' height='14' rx='7' fill='${PRIMARY_TOKEN}' fill-opacity='0.7'/>`,
    `<rect x='40' y='428' width='120' height='10' rx='5' fill='${PRIMARY_TOKEN}' fill-opacity='0.45'/>`,
    '</svg>',
  ];
  const svg = shapes.join('');
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}

const POSTER_IMAGE = drawPoster();

const CLOSE_BUTTON_CLASS = cn(
  buttonVariants({ variant: 'outline', size: 'icon' }),
  'fixed top-6 right-6'
);

export function MorphingDialogBasicImage() {
  return (
    <MorphingDialog
      transition={{
        duration: 0.3,
        ease: EASE_IN_OUT_STRONG,
      }}
    >
      <MorphingDialogTrigger>
        <MorphingDialogImage
          src={POSTER_IMAGE}
          alt={POSTER_ALT}
          className='max-w-xs rounded-lg'
        />
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent className='relative'>
          <MorphingDialogImage
            src={POSTER_IMAGE}
            alt={POSTER_ALT}
            className='h-auto w-full max-w-[90vw] rounded-lg object-cover lg:h-[90vh]'
          />
        </MorphingDialogContent>
        <MorphingDialogClose
          className={CLOSE_BUTTON_CLASS}
          variants={{
            initial: { opacity: 0 },
            animate: {
              opacity: 1,
              transition: { delay: 0.3, duration: 0.1 },
            },
            exit: { opacity: 0, transition: { duration: 0 } },
          }}
        >
          <XIcon />
        </MorphingDialogClose>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}
