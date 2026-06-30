type NavigationItem = {
  name: string;
  href: string;
  isNew?: boolean;
  isUpdated?: boolean;
};

type NavigationGroup = {
  name: string;
  children: NavigationItem[];
};

export const NAVIGATION: NavigationGroup[] = [
  {
    name: 'Getting Started',
    children: [
      {
        name: 'Introduction',
        href: '/docs',
      },
      {
        name: 'Installation',
        href: '/docs/installation',
      },
    ],
  },
  {
    name: 'Core Components',
    children: [
      {
        name: 'Accordion',
        href: '/docs/accordion',
      },
      {
        name: 'Animated Background',
        href: '/docs/animated-background',
      },
      {
        name: 'Animated Group',
        href: '/docs/animated-group',
      },
      {
        name: 'Border Trail',
        href: '/docs/border-trail',
      },
      {
        name: 'Carousel',
        href: '/docs/carousel',
        isUpdated: true,
      },
      {
        name: 'Code Tree Viewer',
        href: '/docs/code-tree-viewer',
        isNew: true,
      },
      {
        name: 'Cursor',
        href: '/docs/cursor',
      },
      {
        name: 'Dialog',
        href: '/docs/dialog',
      },
      {
        name: 'Directional Drawer',
        href: '/docs/directional-drawer',
        isNew: true,
      },
      {
        name: 'Disclosure',
        href: '/docs/disclosure',
      },
      {
        name: 'In View',
        href: '/docs/in-view',
      },
      {
        name: 'Infinite Slider',
        href: '/docs/infinite-slider',
      },
      {
        name: 'Terminal',
        href: '/docs/terminal',
        isNew: true,
      },
      {
        name: 'Transition Panel',
        href: '/docs/transition-panel',
      },
    ],
  },
  {
    name: 'Text Effects',
    children: [
      {
        name: 'Text Effect',
        href: '/docs/text-effect',
      },
      {
        name: 'Text Loop',
        href: '/docs/text-loop',
      },
      {
        name: 'Text Morph',
        href: '/docs/text-morph',
      },
      {
        name: 'Text Roll',
        href: '/docs/text-roll',
      },
      {
        name: 'Text Scramble',
        href: '/docs/text-scramble',
      },
      {
        name: 'Text Shimmer',
        href: '/docs/text-shimmer',
      },
      {
        name: 'Text Shimmer Wave',
        href: '/docs/text-shimmer-wave',
      },
      {
        name: 'Word Roll',
        href: '/docs/word-roll',
        isNew: true,
      },
    ],
  },
  {
    name: 'Number Effects',
    children: [
      {
        name: 'Animated Number',
        href: '/docs/animated-number',
      },
      {
        name: 'Motion Number',
        href: '/docs/motion-number',
        isNew: true,
      },
      {
        name: 'Sliding Number',
        href: '/docs/sliding-number',
      },
    ],
  },
  {
    name: 'Interactive Elements',
    children: [
      {
        name: 'Dock',
        href: '/docs/dock',
      },
      {
        name: 'Glow Effect',
        href: '/docs/glow-effect',
      },
      {
        name: 'Hover Cards',
        href: '/docs/hover-cards',
        isNew: true,
      },
      {
        name: 'Image Comparison',
        href: '/docs/image-comparison',
      },
      {
        name: 'Magnified Dock',
        href: '/docs/magnified-doc',
        isNew: true,
      },
      {
        name: 'Scroll Progress',
        href: '/docs/scroll-progress',
      },
      {
        name: 'Spinning Text',
        href: '/docs/spinning-text',
      },
      {
        name: 'Spotlight',
        href: '/docs/spotlight',
      },
      {
        name: 'Spotlight Cards',
        href: '/docs/spotlight-cards',
        isNew: true,
      },
      {
        name: 'Tilt',
        href: '/docs/tilt',
      },
    ],
  },
  {
    name: 'Toolbars',
    children: [
      {
        name: 'Toolbar Dynamic',
        href: '/docs/toolbar-dynamic',
      },
      {
        name: 'Toolbar Expandable',
        href: '/docs/toolbar-expandable',
      },
    ],
  },
  {
    name: 'Advanced Effects',
    children: [
      {
        name: 'Magnetic',
        href: '/docs/magnetic',
      },
      {
        name: 'Morphing Dialog',
        href: '/docs/morphing-dialog',
      },
      {
        name: 'Morphing Popover',
        href: '/docs/morphing-popover',
      },
      {
        name: 'Progressive Blur',
        href: '/docs/progressive-blur',
      },
    ],
  },
  {
    name: 'Scroll Effects',
    children: [
      {
        name: 'Horizontal Scroll',
        href: '/docs/horizontal-scroll',
        isNew: true,
      },
      {
        name: 'Scroll Animation',
        href: '/docs/scroll-animation',
        isNew: true,
      },
      {
        name: 'Scroll Text',
        href: '/docs/scroll-text',
        isNew: true,
      },
      {
        name: 'Scroll Text Marquee',
        href: '/docs/scroll-text-marquee',
        isNew: true,
      },
      {
        name: 'Smooth Scroll',
        href: '/docs/smooth-scroll',
        isNew: true,
      },
      {
        name: 'Stacking Cards',
        href: '/docs/stacking-cards',
        isNew: true,
      },
      {
        name: 'Sticky Scroll',
        href: '/docs/sticky-scroll',
        isNew: true,
      },
      {
        name: 'Timeline Animation',
        href: '/docs/timeline-animation',
        isNew: true,
      },
    ],
  },
  {
    name: 'Image Effects',
    children: [
      {
        name: 'Image Accordion',
        href: '/docs/image-accordion',
        isNew: true,
      },
      {
        name: 'Image Reveal',
        href: '/docs/image-reveal',
        isNew: true,
      },
      {
        name: 'Image Tabs',
        href: '/docs/image-tabs',
        isNew: true,
      },
      {
        name: 'Image Trail',
        href: '/docs/image-trail',
        isNew: true,
      },
    ],
  },
  {
    name: 'Layout Effects',
    children: [
      {
        name: 'Animated Beam',
        href: '/docs/animated-beam',
        isNew: true,
      },
      {
        name: 'Linear Modal',
        href: '/docs/linear-modal',
        isNew: true,
      },
      {
        name: 'Marquee',
        href: '/docs/marquee',
        isNew: true,
      },
      {
        name: 'Masonry Grid',
        href: '/docs/masonry-grid',
        isNew: true,
      },
      {
        name: 'Reorder List',
        href: '/docs/reorder-list',
        isNew: true,
      },
      {
        name: 'Swap Grid',
        href: '/docs/swap-grid',
        isNew: true,
      },
    ],
  },
];
