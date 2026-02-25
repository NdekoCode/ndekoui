import { SpinningText } from '@/components/core/spinning-text';

export function SpinningTextBasic() {
  return (
    <SpinningText
      radius={5}
      fontSize={1.2}
      className='text-foreground leading-none font-medium'
    >
      {`pre-order • pre-order • pre-order • `}
    </SpinningText>
  );
}
