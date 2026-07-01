import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogTitle,
  MorphingDialogImage,
  MorphingDialogSubtitle,
  MorphingDialogClose,
  MorphingDialogDescription,
  MorphingDialogContainer,
} from '@/components/core/morphing-dialog';
import { PlusIcon } from '@/registry/ndeko/lib/icons';

const PRIMARY_TOKEN = 'hsl(239 84% 67%)';

const LAMP_ALT =
  'The Halden desk lamp drawn in flat shapes: a round base, two arms and a cone shade.';

function drawLampTile() {
  const shapes = [
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 540 360'>",
    `<rect width='540' height='360' fill='${PRIMARY_TOKEN}' fill-opacity='0.1'/>`,
    `<rect x='215' y='292' width='110' height='14' rx='7' fill='${PRIMARY_TOKEN}'/>`,
    `<path d='M270 292 L222 190 L330 112' fill='none' stroke='${PRIMARY_TOKEN}' stroke-width='8' stroke-linecap='round' stroke-linejoin='round'/>`,
    `<circle cx='222' cy='190' r='10' fill='${PRIMARY_TOKEN}'/>`,
    `<path d='M314 108 L346 108 L374 172 L286 172 Z' fill='${PRIMARY_TOKEN}' fill-opacity='0.85'/>`,
    '</svg>',
  ];
  const svg = shapes.join('');
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}

const LAMP_IMAGE = drawLampTile();

export function MorphingDialogBasicOne() {
  return (
    <MorphingDialog
      transition={{
        type: 'spring',
        bounce: 0.05,
        duration: 0.25,
      }}
    >
      <MorphingDialogTrigger
        style={{
          borderRadius: '14px',
        }}
        className='hairline-ring ring-border bg-card flex max-w-[270px] flex-col overflow-hidden shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      >
        <MorphingDialogImage
          src={LAMP_IMAGE}
          alt={LAMP_ALT}
          className='h-48 w-full object-cover'
        />
        <div className='flex grow flex-row items-end justify-between px-3 py-2'>
          <div className='text-left'>
            <MorphingDialogTitle className='text-foreground text-sm font-medium'>
              Halden
            </MorphingDialogTitle>
            <MorphingDialogSubtitle className='text-muted-foreground text-xs'>
              Atelier Ombre
            </MorphingDialogSubtitle>
          </div>
          <span
            aria-hidden='true'
            className='bg-foreground/[0.05] text-muted-foreground ml-1 grid size-6 shrink-0 place-items-center rounded-md'
          >
            <PlusIcon className='size-3' />
          </span>
        </div>
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent
          style={{
            borderRadius: '18px',
          }}
          className='hairline-ring ring-border bg-card pointer-events-auto relative flex h-auto w-full flex-col overflow-hidden shadow-xl shadow-black/8 sm:w-[500px]'
        >
          <MorphingDialogImage
            src={LAMP_IMAGE}
            alt={LAMP_ALT}
            className='h-full w-full'
          />
          <div className='p-6'>
            <MorphingDialogTitle className='text-foreground text-lg font-semibold'>
              Halden
            </MorphingDialogTitle>
            <MorphingDialogSubtitle className='text-muted-foreground text-sm'>
              Atelier Ombre
            </MorphingDialogSubtitle>
            <MorphingDialogDescription
              disableLayoutAnimation
              variants={{
                initial: { opacity: 0, scale: 0.8, y: 100 },
                animate: { opacity: 1, scale: 1, y: 0 },
                exit: { opacity: 0, scale: 0.8, y: 100 },
              }}
            >
              <p className='text-muted-foreground mt-2 text-sm'>
                Halden is a desk lamp with two jointed arms and a cone shade
                that turns a full circle. It leans over a keyboard or folds flat
                against a shelf.
              </p>
              <p className='text-muted-foreground mt-2 text-sm'>
                Atelier Ombre makes each one by hand in a small workshop in
                Lyon, from powder-coated steel and a solid oak base.
              </p>
              <a
                className='text-primary-ink mt-2 inline-flex text-sm underline-offset-4 hover:underline'
                href='#'
              >
                Read the care guide
              </a>
            </MorphingDialogDescription>
          </div>
          <MorphingDialogClose className='text-foreground' />
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}
