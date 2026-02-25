import { SpinningText } from '@/components/core/spinning-text';

const EASE_IN_OUT_STRONG = [0.77, 0, 0.175, 1] as const;

export function SpinningTextCustomTransition() {
  return (
    <SpinningText
      radius={7}
      fontSize={1}
      duration={6}
      transition={{
        ease: EASE_IN_OUT_STRONG,
        repeat: Infinity,
      }}
      className='text-foreground font-mono'
    >
      {` •  • `}
    </SpinningText>
  );
}
