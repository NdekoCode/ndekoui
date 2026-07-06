'use client';

import { useState } from 'react';

/** Whether a mouse or a pen rests on an element. A finger does not hover, so a touch never counts. */
export function useHover() {
  const [isHovered, setIsHovered] = useState(false);

  function hoverStarts(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'touch') {
      setIsHovered(true);
    }
  }

  function hoverEnds() {
    setIsHovered(false);
  }

  const hoverHandlers = {
    onPointerEnter: hoverStarts,
    onPointerLeave: hoverEnds,
  };

  return { isHovered, hoverHandlers };
}
