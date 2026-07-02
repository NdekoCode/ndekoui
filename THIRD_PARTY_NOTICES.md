# Third-party notices

ndekoui includes or adapts work from the projects below. Each keeps its own licence and copyright notice.

## Motion Primitives

The motion components in `components/core`, their examples in `app/docs` and the original documentation site come from Motion Primitives (<https://github.com/ibelick/motion-primitives>).

```text
MIT License

Copyright (c) 2024 ibelick

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Origin UI

The compositions under `registry/ndeko/components` are redrawn from the Origin UI catalogue, as published under the MIT licence up to commit `921a9b2e` (2025-08-07) of <https://github.com/origin-space/originui> (the repository now lives at <https://github.com/cosscom/coss>). Later versions of that repository carry another licence and are not used.

```text
MIT License

Copyright (c) 2025 Origin UI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## prompt-kit

The chat primitives under `registry/ndeko/ui/chat-*` are adapted from prompt-kit at commit `5a94966` (2026-09-28) of <https://github.com/ibelick/prompt-kit>, redrawn on the ndekoui primitives, tokens and recipes.

```text
MIT License

Copyright (c) 2025 Julien Thibeaut

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## React Spectrum

`hooks/usePreventScroll.tsx` is adapted from `usePreventScroll` in React Aria, part of React Spectrum (<https://github.com/adobe/react-spectrum>), Copyright 2020 Adobe. It is licensed under the Apache License, Version 2.0; the full text is in `LICENSES/Apache-2.0.txt`. The file was modified for ndekoui: types, formatting and lint fixes.

## Simple Icons

The brand marks in `registry/ndeko/lib/brand-logos.tsx`, the v0, Cursor and Claude marks of the site's Open in menu (`app/_site/open-in/tool-marks.tsx`), and the client marks of the MCP page (`app/mcp/_components/client-marks.tsx`), are SVG paths and colours taken from Simple Icons 16.33.0 (<https://github.com/simple-icons/simple-icons>), released under CC0 1.0 Universal. Every mark is a trademark of its owner. It is shown only to name the tool a block connects to, and its use stays subject to that brand's own guidelines. No brand endorses ndekoui.

## Magic UI

Several motion components take their idea and their props from Magic UI (<https://magicui.design>, MIT): globe, dotted map, orbiting circles, lens, border beam, shine border, magic card, confetti, the post card, the word rotate, the highlighter, text 3D flip, scroll velocity, and the Safari, iPhone and Android mockups. The circular theme change of the site (`lib/theme-transition.ts`) follows the mechanism of Magic UI's animated theme toggler, by way of the author's portfolio. Their code is written for ndekoui; none of Magic UI's code was copied.

The land grid in `components/core/dotted-map-points.ts` is generated once by `scripts/generate-dotted-map.ts` from the countries data that ships with dotted-map (MIT).

## Dependencies

These are installed as packages and keep their own licences:

- MIT: Base UI (`@base-ui/react`), motion, Hugeicons (`@hugeicons/react`, `@hugeicons/core-free-icons`), clsx, tailwind-merge, cmdk, sonner, react-day-picker, date-fns, `@tanstack/react-table`, `@dnd-kit/*`, `@headless-tree/*`, `@origin-space/image-cropper`, react-payment-inputs, react-phone-number-input, use-mask-input, use-stick-to-bottom, react-markdown, remark-gfm, remark-breaks, marked, shiki, cobe, zod and, at build time only, dotted-map.
- Apache-2.0: class-variance-authority, react-aria, react-aria-components, `@internationalized/date`, mcp-handler and `@modelcontextprotocol/server`.
