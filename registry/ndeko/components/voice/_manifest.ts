import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'voice-01',
    source: 'ndeko',
    title: 'Voice orb',
    description:
      'A disc and a ring of fine bars drawn on a canvas: it breathes when idle, follows your voice or a simulated one, sweeps while thinking and swells while speaking.',
  },
  {
    name: 'voice-02',
    source: 'ndeko',
    title: 'Voice note',
    description:
      'A voice reply whose dots ink in as it plays, with a speed key that steps to 2x, seeking by click, drag or arrows, and a transcript that follows word by word.',
  },
  {
    name: 'voice-03',
    source: 'ndeko',
    title: 'Dictation',
    description:
      'A field whose microphone key turns the footer into a recording strip, then transcribes the take and streams the words in at the caret.',
  },
];
