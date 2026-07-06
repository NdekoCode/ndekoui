import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'file-upload-01',
    source: 'comp-125',
    title: 'Image upload button',
    description: 'Picks an image, previews it and lets you remove it.',
  },
  {
    name: 'file-upload-02',
    source: 'comp-126',
    title: 'Avatar upload button',
    description:
      'A round button that shows the chosen avatar, with a remove badge.',
  },
  {
    name: 'file-upload-03',
    source: 'comp-543',
    title: 'Avatar drop area',
    description:
      'A round dashed slot that takes a dropped or picked image as the avatar.',
  },
  {
    name: 'file-upload-04',
    source: 'comp-544',
    title: 'Image drop zone',
    description:
      'A zone you click or drop on that fills with the image, within a size limit.',
  },
  {
    name: 'file-upload-05',
    source: 'comp-545',
    title: 'Image drop zone with button',
    description:
      'A drop zone with a select button that shows the image inside it.',
  },
  {
    name: 'file-upload-06',
    source: 'comp-546',
    title: 'Image grid uploader',
    description:
      'Several images in a grid inside the drop zone, each with a remove badge.',
  },
  {
    name: 'file-upload-07',
    source: 'comp-547',
    title: 'Image list uploader',
    description: 'A drop zone above a list of images with their sizes.',
  },
  {
    name: 'file-upload-08',
    source: 'comp-548',
    title: 'Single file uploader',
    description:
      'One file at a time, picked or dropped, shown in a row under the zone.',
  },
  {
    name: 'file-upload-09',
    source: 'comp-549',
    title: 'File list uploader',
    description:
      'Files of any type listed under the zone with an icon for their kind.',
  },
  {
    name: 'file-upload-10',
    source: 'comp-550',
    title: 'File list in the zone',
    description:
      'Uploaded files listed inside the drop zone with remove and add actions.',
  },
  {
    name: 'file-upload-11',
    source: 'comp-551',
    title: 'File table uploader',
    description: 'Uploaded files in a table with their type, size and actions.',
  },
  {
    name: 'file-upload-12',
    source: 'comp-552',
    title: 'File card grid',
    description:
      'Mixed files as cards with a preview or a kind icon, a name and a size.',
  },
  {
    name: 'file-upload-13',
    source: 'comp-553',
    title: 'Upload with progress',
    description:
      'Each added file shows a progress bar until its simulated upload ends.',
  },
  {
    name: 'file-upload-14',
    source: 'comp-554',
    title: 'Avatar uploader with cropper',
    description:
      'Picks an image, opens a dialog to crop and zoom it, then sets it as the avatar.',
  },
  {
    name: 'file-upload-15',
    source: 'ndeko',
    title: 'Folder that takes files',
    description:
      'A drawn folder whose flap tips open while files are dragged over it; dropped files fall in as sheets and a list under it shows each upload with its progress.',
  },
];
