import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogTitle,
  MorphingDialogImage,
  MorphingDialogSubtitle,
  MorphingDialogClose,
  MorphingDialogContainer,
} from '@/components/core/morphing-dialog';
import { ScrollArea } from '@/components/website/scroll-area';

const PRIMARY_TOKEN = 'hsl(239 84% 67%)';

const COVER_ALT =
  'Cover of The Quiet Mile: a round sun above two title bars, in flat shapes.';

function drawBookCover() {
  const shapes = [
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300'>",
    `<rect width='200' height='300' fill='${PRIMARY_TOKEN}' fill-opacity='0.14'/>`,
    `<circle cx='100' cy='118' r='42' fill='${PRIMARY_TOKEN}'/>`,
    `<rect x='40' y='206' width='120' height='12' rx='6' fill='${PRIMARY_TOKEN}' fill-opacity='0.8'/>`,
    `<rect x='60' y='230' width='80' height='8' rx='4' fill='${PRIMARY_TOKEN}' fill-opacity='0.5'/>`,
    '</svg>',
  ];
  const svg = shapes.join('');
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}

const COVER_IMAGE = drawBookCover();

export function MorphingDialogBasicTwo() {
  return (
    <MorphingDialog
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 24,
      }}
    >
      <MorphingDialogTrigger
        style={{
          borderRadius: '10px',
        }}
        className='hairline-ring ring-border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      >
        <div className='flex items-center space-x-3 p-3'>
          <MorphingDialogImage
            src={COVER_IMAGE}
            alt={COVER_ALT}
            className='h-8 w-8 object-cover object-top'
            style={{
              borderRadius: '6px',
            }}
          />
          <div className='flex flex-col items-start justify-center space-y-0'>
            <MorphingDialogTitle className='text-foreground text-[10px] font-medium sm:text-xs'>
              The Quiet Mile
            </MorphingDialogTitle>
            <MorphingDialogSubtitle className='text-muted-foreground text-[10px] sm:text-xs'>
              Ama Mensah
            </MorphingDialogSubtitle>
          </div>
        </div>
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent
          style={{
            borderRadius: '18px',
          }}
          className='hairline-ring ring-border bg-card relative h-auto w-[500px] shadow-xl shadow-black/8'
        >
          <ScrollArea className='h-[90vh]' type='scroll'>
            <div className='relative p-6'>
              <div className='flex justify-center py-10'>
                <MorphingDialogImage
                  src={COVER_IMAGE}
                  alt={COVER_ALT}
                  className='h-auto w-[200px]'
                />
              </div>
              <div>
                <MorphingDialogTitle className='text-foreground'>
                  The Quiet Mile
                </MorphingDialogTitle>
                <MorphingDialogSubtitle className='text-muted-foreground font-light'>
                  Ama Mensah
                </MorphingDialogSubtitle>
                <div className='text-muted-foreground mt-4 space-y-3 text-sm'>
                  <p>
                    Ama Mensah started running at thirty-four, the week she
                    closed the bakery she had kept for nine years. She wanted
                    one hour a day that belonged to nobody else, and a pair of
                    shoes was the cheapest way to get it.
                  </p>
                  <p>
                    The Quiet Mile follows the eighteen months between that
                    first lap of the park and her first marathon in Accra. It is
                    part training log, part notebook: the routes she kept, the
                    injuries she ignored, the friends who joined her at six in
                    the morning and the ones who stopped answering.
                  </p>
                  <p>
                    It is a short, plain book about patience. Readers who have
                    never run will find a story about starting over; runners
                    will recognise every blister.
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
          <MorphingDialogClose className='text-muted-foreground' />
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}
