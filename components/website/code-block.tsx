import { extractCodeFromFilePath } from '@/lib/code';
import CodePreview from './code-preview';
import CodeRenderer from './code-renderer';
import { cn } from '@/lib/utils';

type CodeBlockProps = {
  filePath?: string;
  code?: string;
  lang?: string;
  className?: string;
};

function sourceOf(filePath: string | undefined, code: string) {
  if (filePath) {
    return extractCodeFromFilePath(filePath);
  }
  return code;
}

export default function CodeBlock({
  filePath,
  code = '',
  lang = 'tsx',
  className,
}: CodeBlockProps) {
  const fileContent = sourceOf(filePath, code);

  return (
    <div className={cn('not-prose rounded-xl text-[13px]', className)}>
      <CodePreview code={fileContent}>
        <CodeRenderer code={fileContent} lang={lang} />
      </CodePreview>
    </div>
  );
}
