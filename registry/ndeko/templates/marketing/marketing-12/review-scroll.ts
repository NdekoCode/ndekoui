import { useEffect, useState, type RefObject } from 'react';

export type ScrollEdges = {
  canPrev: boolean;
  canNext: boolean;
  index: number;
};

const EDGE_PX = 4;

const START: ScrollEdges = { canPrev: false, canNext: true, index: 0 };

function cardsOf(scroller: HTMLElement) {
  const list = scroller.firstElementChild;
  if (!list) {
    return [];
  }
  const children = Array.from(list.children);
  return children.filter((child) => child instanceof HTMLElement);
}

export function stepWidthOf(scroller: HTMLElement) {
  const [first, second] = cardsOf(scroller);
  if (!first || !second) {
    return scroller.clientWidth;
  }
  return second.offsetLeft - first.offsetLeft;
}

export function scrollToCard(scroller: HTMLElement, index: number) {
  const left = index * stepWidthOf(scroller);
  scroller.scrollTo({ left, behavior: 'smooth' });
}

export function scrollByCard(scroller: HTMLElement, direction: 1 | -1) {
  const left = direction * stepWidthOf(scroller);
  scroller.scrollBy({ left, behavior: 'smooth' });
}

function readEdges(scroller: HTMLElement): ScrollEdges {
  const maxScroll = scroller.scrollWidth - scroller.clientWidth;
  const canPrev = scroller.scrollLeft > EDGE_PX;
  const canNext = scroller.scrollLeft < maxScroll - EDGE_PX;
  const lastIndex = cardsOf(scroller).length - 1;
  const nearest = Math.round(scroller.scrollLeft / stepWidthOf(scroller));
  const index = Math.min(Math.max(nearest, 0), lastIndex);
  if (!canNext) {
    return { canPrev, canNext, index: lastIndex };
  }
  return { canPrev, canNext, index };
}

function isSameEdges(first: ScrollEdges, second: ScrollEdges) {
  const isSameStart = first.canPrev === second.canPrev;
  const isSameEnd = first.canNext === second.canNext;
  const isSameIndex = first.index === second.index;
  return isSameStart && isSameEnd && isSameIndex;
}

export function useScrollEdges(ref: RefObject<HTMLElement | null>) {
  const [edges, setEdges] = useState<ScrollEdges>(START);

  useEffect(() => {
    const scroller = ref.current;
    if (!scroller) {
      return;
    }

    function update() {
      if (!scroller) {
        return;
      }
      const next = readEdges(scroller);
      setEdges((previous) => {
        if (isSameEdges(previous, next)) {
          return previous;
        }
        return next;
      });
    }

    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    scroller.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener('scroll', update);
    };
  }, [ref]);

  return edges;
}
