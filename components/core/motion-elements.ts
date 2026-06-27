import { motion } from 'motion/react';

const MOTION_ELEMENTS = {
  a: motion.a,
  article: motion.article,
  aside: motion.aside,
  blockquote: motion.blockquote,
  button: motion.button,
  code: motion.code,
  div: motion.div,
  em: motion.em,
  figure: motion.figure,
  footer: motion.footer,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
  header: motion.header,
  label: motion.label,
  li: motion.li,
  main: motion.main,
  nav: motion.nav,
  ol: motion.ol,
  p: motion.p,
  pre: motion.pre,
  section: motion.section,
  small: motion.small,
  span: motion.span,
  strong: motion.strong,
  ul: motion.ul,
};

type MotionElementTag = keyof typeof MOTION_ELEMENTS;

function isMotionElementTag(tag: unknown): tag is MotionElementTag {
  const isString = typeof tag === 'string';
  return isString && tag in MOTION_ELEMENTS;
}

/**
 * The motion version of an HTML tag. A lookup such as `motion[tag]` is invisible to the bundler,
 * which drops the tags it never sees and breaks the production build, so every tag is listed here.
 */
export function motionElementOf(tag: unknown) {
  if (isMotionElementTag(tag)) {
    return MOTION_ELEMENTS[tag];
  }
  return MOTION_ELEMENTS.div;
}
