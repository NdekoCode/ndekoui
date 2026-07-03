import { llmsFullText } from '@/app/_site/llms';

export const dynamic = 'force-static';

const TEXT_HEADERS = { 'Content-Type': 'text/plain; charset=utf-8' };

export function GET() {
  return new Response(llmsFullText(), { headers: TEXT_HEADERS });
}
