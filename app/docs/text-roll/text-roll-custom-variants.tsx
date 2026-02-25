import { TextRoll } from '@/components/core/text-roll';

export function TextRollCustomVariants() {
  return (
    <TextRoll
      className='text-foreground text-4xl'
      variants={{
        enter: {
          initial: { rotateX: 0, filter: 'blur(0px)' },
          animate: { rotateX: 90, filter: 'blur(2px)' },
        },
        exit: {
          initial: { rotateX: 90, filter: 'blur(2px)' },
          animate: { rotateX: 0, filter: 'blur(0px)' },
        },
      }}
    >
      ndekoui
    </TextRoll>
  );
}
