import { CopyButton } from '@/app/_site/copy-button';

type CodePreviewProps = {
  code: string;
  children: React.ReactNode;
};

export default function CodePreview({ code, children }: CodePreviewProps) {
  return (
    <div className='dark bg-card text-card-foreground hairline-ring ring-border relative rounded-xl'>
      <div className='absolute top-2 right-2 z-10'>
        <CopyButton value={code} label='Copy code' />
      </div>
      <div className='max-h-[650px] overflow-auto rounded-xl'>
        <div className='inline-block overflow-x-auto p-4 text-[13px] leading-relaxed [&_pre]:!bg-transparent'>
          {children}
        </div>
      </div>
    </div>
  );
}
