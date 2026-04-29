import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function logoDataUrl() {
  const logoPath = path.join(process.cwd(), 'public/logo.svg');
  const svg = await readFile(logoPath);
  return `data:image/svg+xml;base64,${svg.toString('base64')}`;
}
