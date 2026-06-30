import path from 'path';
import { Schema, RegistryType } from './registry-schema';

type ComponentDefinition = Partial<
  Pick<
    Schema,
    | 'dependencies'
    | 'devDependencies'
    | 'registryDependencies'
    | 'cssVars'
    | 'tailwind'
  >
> & {
  name: string;
  path: string;
  description: string;
  files?: {
    name: string;
    path: string;
    type?: RegistryType;
  }[];
};

export const components: ComponentDefinition[] = [
  {
    name: 'accordion',
    path: path.join(__dirname, '../components/core/accordion.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A collapsible content component with smooth animations for showing and hiding content.',
  },
  {
    name: 'animated-background',
    path: path.join(__dirname, '../components/core/animated-background.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A component that provides animated background effects for UI elements.',
  },
  {
    name: 'animated-group',
    path: path.join(__dirname, '../components/core/animated-group.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A container component that applies coordinated animations to a group of child elements.',
  },
  {
    name: 'animated-number',
    path: path.join(__dirname, '../components/core/animated-number.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A component that animates number changes with smooth transitions.',
  },
  {
    name: 'border-trail',
    path: path.join(__dirname, '../components/core/border-trail.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'An effect that creates animated border trails around elements on interaction.',
  },
  {
    name: 'carousel',
    path: path.join(__dirname, '../components/core/carousel.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A component for cycling through elements with smooth transitions.',
  },
  {
    name: 'cursor',
    path: path.join(__dirname, '../components/core/cursor.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A custom cursor component with animated effects and interactions.',
  },
  {
    name: 'dialog',
    path: path.join(__dirname, '../components/core/dialog.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A modal dialog component with smooth entrance and exit animations.',
    files: [
      {
        name: 'hooks/usePreventScroll.tsx',
        path: path.join(__dirname, '../hooks/usePreventScroll.tsx'),
        type: 'registry:hook',
      },
    ],
  },
  {
    name: 'disclosure',
    path: path.join(__dirname, '../components/core/disclosure.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A component that shows and hides content with animated transitions.',
  },
  {
    name: 'in-view',
    path: path.join(__dirname, '../components/core/in-view.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A component that triggers animations when elements enter the viewport.',
  },
  {
    name: 'infinite-slider',
    path: path.join(__dirname, '../components/core/infinite-slider.tsx'),
    registryDependencies: [],
    dependencies: ['motion', 'react-use-measure'],
    description:
      'A slider component that loops infinitely through its content.',
  },
  {
    name: 'transition-panel',
    path: path.join(__dirname, '../components/core/transition-panel.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A panel component with smooth transitions between different states.',
  },
  {
    name: 'text-effect',
    path: path.join(__dirname, '../components/core/text-effect.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description: 'A component that applies animated effects to text content.',
  },
  {
    name: 'text-loop',
    path: path.join(__dirname, '../components/core/text-loop.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A component that cycles through different text phrases with animations.',
  },
  {
    name: 'text-morph',
    path: path.join(__dirname, '../components/core/text-morph.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A component that morphs between different text strings with smooth transitions.',
  },
  {
    name: 'text-roll',
    path: path.join(__dirname, '../components/core/text-roll.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description: 'A component that animates text with a rolling effect.',
  },
  {
    name: 'text-scramble',
    path: path.join(__dirname, '../components/core/text-scramble.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'Text that scrambles into place on mount, when it scrolls into view or on hover of its link.',
  },
  {
    name: 'text-shimmer',
    path: path.join(__dirname, '../components/core/text-shimmer.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description: 'A component that applies a shimmering effect to text.',
  },
  {
    name: 'text-shimmer-wave',
    path: path.join(__dirname, '../components/core/text-shimmer-wave.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description: 'A component that creates a wave-like shimmer effect on text.',
  },
  {
    name: 'word-roll',
    path: path.join(__dirname, '../components/core/word-roll.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A short label whose changed words roll out and the new ones rise in, in the direction of the change.',
  },
  {
    name: 'safari',
    path: path.join(__dirname, '../components/core/safari.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A macOS browser window drawn in CSS around a picture, a video or live UI, with a chrome that follows the theme.',
  },
  {
    name: 'iphone',
    path: path.join(__dirname, '../components/core/iphone.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A modern iPhone drawn in SVG and CSS, with a titanium frame, a Dynamic Island and a status bar that follows the screen.',
  },
  {
    name: 'android',
    path: path.join(__dirname, '../components/core/android.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'An unbranded Android phone drawn in SVG and CSS, with a punch-hole camera, thin even bezels and a gesture bar.',
  },
  {
    name: 'text-3d-flip',
    path: path.join(__dirname, '../components/core/text-3d-flip.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'Letters that turn over like small blocks, one after another, when the link or button they sit in is hovered or focused.',
  },
  {
    name: 'highlighter',
    path: path.join(__dirname, '../components/core/highlighter.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'Hand-drawn marks on text, a marker band, an underline, a box, a circle or a strike, drawn in when the text comes into view.',
  },
  {
    name: 'word-rotate',
    path: path.join(__dirname, '../components/core/word-rotate.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'Phrases on a drum that turns on a timer, with the sentence around them sliding to the new width.',
  },
  {
    name: 'scroll-velocity',
    path: path.join(__dirname, '../components/core/scroll-velocity.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'Stacked rows of text or pictures that loop sideways, speed up with the scroll, turn around when it scrolls up and lean into their speed.',
  },
  {
    name: 'globe',
    path: path.join(__dirname, '../components/core/globe.tsx'),
    registryDependencies: [],
    dependencies: ['cobe', 'motion'],
    description:
      'A WebGL globe in the theme colours that turns on its own, follows a drag with momentum and glides to a chosen city.',
  },
  {
    name: 'dotted-map',
    path: path.join(__dirname, '../components/core/dotted-map.tsx'),
    registryDependencies: [],
    dependencies: [],
    description:
      'A world map drawn in dots from a pre-generated grid, with markers, labels and a slow pulse.',
  },
  {
    name: 'orbiting-circles',
    path: path.join(__dirname, '../components/core/orbiting-circles.tsx'),
    registryDependencies: [],
    dependencies: [],
    description:
      'Icons or avatars on concentric orbits around a centre, driven by CSS, with radius, speed, direction and a pause.',
  },
  {
    name: 'lens',
    path: path.join(__dirname, '../components/core/lens.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A round magnifier that follows the pointer over an image or any content, and moves with the arrow keys when focused.',
  },
  {
    name: 'border-beam',
    path: path.join(__dirname, '../components/core/border-beam.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A beam in the primary colour that travels around the border of a card, its tail fading behind it and bending round the corners.',
  },
  {
    name: 'shine-border',
    path: path.join(__dirname, '../components/core/shine-border.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A slanted glint that sweeps across the border of a card, on a slow loop or once on hover and keyboard focus.',
  },
  {
    name: 'magic-card',
    path: path.join(__dirname, '../components/core/magic-card.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A card whose edge lights up on the side the pointer comes from, before the pointer reaches it.',
  },
  {
    name: 'confetti',
    path: path.join(__dirname, '../components/core/confetti.tsx'),
    registryDependencies: [],
    dependencies: [],
    description:
      'A canvas burst of confetti from a button or a function call, in the brand colours and with no package.',
  },
  {
    name: 'post-card',
    path: path.join(__dirname, '../components/core/post-card.tsx'),
    registryDependencies: [],
    dependencies: [],
    description:
      'A social post card built from static props: author, text, pictures, date and counts. Nothing is fetched.',
  },
  {
    name: 'magnetic',
    path: path.join(__dirname, '../components/core/magnetic.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A component that creates a magnetic attraction effect on hover.',
  },
  {
    name: 'morphing-dialog',
    path: path.join(__dirname, '../components/core/morphing-dialog.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A dialog that morphs from its trigger element with smooth transitions.',
    files: [
      {
        name: 'hooks/useClickOutside.tsx',
        path: path.join(__dirname, '../hooks/useClickOutside.tsx'),
        type: 'registry:hook',
      },
    ],
  },
  {
    name: 'morphing-popover',
    path: path.join(__dirname, '../components/core/morphing-popover.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A popover component that morphs from its trigger with fluid animations.',
    files: [
      {
        name: 'hooks/useClickOutside.tsx',
        path: path.join(__dirname, '../hooks/useClickOutside.tsx'),
        type: 'registry:hook',
      },
    ],
  },
  {
    name: 'dock',
    path: path.join(__dirname, '../components/core/dock.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A macOS-style dock of buttons or links that magnify near the pointer, with labels and separators.',
  },
  {
    name: 'glow-effect',
    path: path.join(__dirname, '../components/core/glow-effect.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A component that creates a glowing effect on elements based on cursor movement.',
  },
  {
    name: 'image-comparison',
    path: path.join(__dirname, '../components/core/image-comparison.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A component for comparing two images with an interactive slider.',
  },
  {
    name: 'toolbar-dynamic',
    path: path.join(__dirname, '../components/core/toolbar-dynamic.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A toolbar component with dynamic appearance based on user interaction.',
    files: [
      {
        name: 'hooks/useClickOutside.tsx',
        path: path.join(__dirname, '../hooks/useClickOutside.tsx'),
        type: 'registry:hook',
      },
    ],
  },
  {
    name: 'toolbar-expandable',
    path: path.join(__dirname, '../components/core/toolbar-expandable.tsx'),
    registryDependencies: [],
    dependencies: ['motion', 'react-use-measure'],
    description:
      'An expandable toolbar that reveals additional options with animations.',
    files: [
      {
        name: 'hooks/useClickOutside.tsx',
        path: path.join(__dirname, '../hooks/useClickOutside.tsx'),
        type: 'registry:hook',
      },
    ],
  },
  {
    name: 'progressive-blur',
    path: path.join(__dirname, '../components/core/progressive-blur.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A component that applies progressive blur effects to elements.',
  },
  {
    name: 'scroll-progress',
    path: path.join(__dirname, '../components/core/scroll-progress.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A component that visualizes scroll progress with animated indicators.',
  },
  {
    name: 'sliding-number',
    path: path.join(__dirname, '../components/core/sliding-number.tsx'),
    registryDependencies: [],
    dependencies: ['motion', 'react-use-measure'],
    description:
      'A component that transitions between numbers with a sliding animation.',
  },
  {
    name: 'spotlight',
    path: path.join(__dirname, '../components/core/spotlight.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A component that creates a spotlight effect following cursor movement.',
  },
  {
    name: 'spinning-text',
    path: path.join(__dirname, '../components/core/spinning-text.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A component that animates text with a spinning rotation effect.',
  },
  {
    name: 'tilt',
    path: path.join(__dirname, '../components/core/tilt.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A component that applies 3D tilt effects to elements based on cursor position.',
  },
  {
    name: 'motion-number',
    path: path.join(__dirname, '../components/core/motion-number.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A formatted number whose digits roll to their new value in the direction of the change.',
  },
  {
    name: 'terminal',
    path: path.join(__dirname, '../components/core/terminal.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A command line for developer docs that types its commands and prints their output line by line.',
  },
  {
    name: 'directional-drawer',
    path: path.join(__dirname, '../components/core/directional-drawer.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A drawer from any side that follows the drag, closes on a flick and resists being pulled the wrong way.',
  },
  {
    name: 'code-tree-viewer',
    path: path.join(__dirname, '../components/core/code-tree-viewer.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A file tree beside a code panel with highlighted code, file name and copy.',
  },
  {
    name: 'spotlight-cards',
    path: path.join(__dirname, '../components/core/spotlight-cards.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A grid of link cards where a soft light follows the mouse and lights the hairline borders nearby.',
  },
  {
    name: 'hover-cards',
    path: path.join(__dirname, '../components/core/hover-cards.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'Link cards with four hover treatments: zoom, rise, tilt and trace.',
  },
  {
    name: 'magnified-doc',
    path: path.join(__dirname, '../components/core/magnified-doc.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A dock of icons that magnify near the pointer and switch the content of the stage above them.',
  },
  {
    name: 'scroll-text',
    path: path.join(__dirname, '../components/core/scroll-text.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'Text that reveals word by word, letter by letter or under a highlight as it scrolls through the viewport.',
  },
  {
    name: 'scroll-text-marquee',
    path: path.join(__dirname, '../components/core/scroll-text-marquee.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A large line of text that loops sideways and speeds up with the scroll.',
  },
  {
    name: 'horizontal-scroll',
    path: path.join(__dirname, '../components/core/horizontal-scroll.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A pinned row of cards that travels sideways as the page scrolls down.',
  },
  {
    name: 'sticky-scroll',
    path: path.join(__dirname, '../components/core/sticky-scroll.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'Steps that scroll past a pinned picture, which changes in place to match the step being read.',
  },
  {
    name: 'stacking-cards',
    path: path.join(__dirname, '../components/core/stacking-cards.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'Cards that pin and pile up as the page scrolls, each one behind shrinking and fading back a little.',
  },
  {
    name: 'timeline-animation',
    path: path.join(__dirname, '../components/core/timeline-animation.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A vertical timeline whose line fills as the page scrolls, with entries that settle in once as they arrive.',
  },
  {
    name: 'scroll-animation',
    path: path.join(__dirname, '../components/core/scroll-animation.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'Reveals that play once when an element scrolls into view, and a parallax layer that drifts with the scroll.',
  },
  {
    name: 'smooth-scroll',
    path: path.join(__dirname, '../components/core/smooth-scroll.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'An opt-in wrapper that eases mouse wheel scrolling and leaves every other way of scrolling native.',
  },
  {
    name: 'image-tabs',
    path: path.join(__dirname, '../components/core/image-tabs.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'Tabs that change an image in place while the indicator travels to the chosen tab.',
  },
  {
    name: 'image-accordion',
    path: path.join(__dirname, '../components/core/image-accordion.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A row of image panels where the hovered or focused one widens to show its caption.',
  },
  {
    name: 'image-reveal',
    path: path.join(__dirname, '../components/core/image-reveal.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A list of titles where the hovered row shows its picture beside the pointer.',
  },
  {
    name: 'image-trail',
    path: path.join(__dirname, '../components/core/image-trail.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'Images that land along the pointer path, then fade and shrink away.',
  },
  {
    name: 'linear-modal',
    path: path.join(__dirname, '../components/core/linear-modal.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'Feature cards that grow into a modal with their full story and a list of what they do.',
  },
  {
    name: 'swap-grid',
    path: path.join(__dirname, '../components/core/swap-grid.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A grid of slots where items are dragged onto each other to swap places, with a full keyboard path.',
  },
  {
    name: 'reorder-list',
    path: path.join(__dirname, '../components/core/reorder-list.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A list reordered by a drag handle, with move up and move down buttons and keyboard reordering.',
  },
  {
    name: 'animated-beam',
    path: path.join(__dirname, '../components/core/animated-beam.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'SVG lines connecting icon tiles, with a highlight travelling along each one.',
  },
  {
    name: 'masonry-grid',
    path: path.join(__dirname, '../components/core/masonry-grid.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description: 'A responsive masonry layout for items of different heights.',
  },
  {
    name: 'marquee',
    path: path.join(__dirname, '../components/core/marquee.tsx'),
    registryDependencies: [],
    dependencies: ['motion'],
    description:
      'A loop of logos, chips or cards driven by CSS, horizontal or vertical, that pauses under the pointer and on focus.',
  },
];
