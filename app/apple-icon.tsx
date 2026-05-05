import { ImageResponse } from 'next/og';

import { logoDataUrl } from './_site/logo-data-url';

export const size = { width: 180, height: 180 };

export const contentType = 'image/png';

export default async function AppleIcon() {
  const logo = await logoDataUrl();

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#ffffff',
      }}
    >
      <img src={logo} width={180} height={180} alt='' />
    </div>,
    size
  );
}
