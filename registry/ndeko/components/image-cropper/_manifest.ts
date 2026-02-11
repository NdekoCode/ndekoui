import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'image-cropper-01',
    source: 'comp-554',
    title: 'Avatar uploader with cropper',
    description:
      'Picks an image, opens a dialog to crop and zoom it, then sets it as the avatar.',
  },
  {
    name: 'image-cropper-02',
    source: 'comp-555',
    title: 'Image cropper',
    description:
      'Drag the image under the crop area and scroll or pinch to zoom.',
  },
  {
    name: 'image-cropper-03',
    source: 'comp-556',
    title: 'Wide cropper',
    description: 'A crop area locked to a 16:9 ratio.',
  },
  {
    name: 'image-cropper-04',
    source: 'comp-557',
    title: 'Brand crop area',
    description: 'The crop area outlined in the brand colour.',
  },
  {
    name: 'image-cropper-05',
    source: 'comp-558',
    title: 'Light mask cropper',
    description: 'A light mask in the card colour around the crop area.',
  },
  {
    name: 'image-cropper-06',
    source: 'comp-559',
    title: 'Full size crop area',
    description: 'A square cropper whose crop area fills it with no padding.',
  },
  {
    name: 'image-cropper-07',
    source: 'comp-560',
    title: 'Round crop area',
    description: 'A circular crop area for avatars.',
  },
  {
    name: 'image-cropper-08',
    source: 'comp-561',
    title: 'Cropper with zoom slider',
    description: 'A slider and its read-out set the zoom of the image.',
  },
  {
    name: 'image-cropper-09',
    source: 'comp-562',
    title: 'Zoom limits',
    description: 'Zoom starts at 2x and goes up to 10x.',
  },
  {
    name: 'image-cropper-10',
    source: 'comp-563',
    title: 'Crop data output',
    description: 'The crop area in pixels, shown as it changes.',
  },
  {
    name: 'image-cropper-11',
    source: 'comp-564',
    title: 'Crop preview',
    description: 'A button crops the selection and shows the result beside it.',
  },
];
