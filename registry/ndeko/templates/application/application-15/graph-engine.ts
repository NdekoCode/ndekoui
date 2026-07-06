import {
  GRAPH_LINKS,
  GRAPH_NODES,
  type GraphLink,
  type NodeKind,
} from './data';
import {
  arrangementOf,
  LAYOUT_IDS,
  type Arrangement,
  type Box,
  type Guide,
  type LayoutId,
} from './graph-layouts';

const GLIDE_MS = 900;

const ACCOUNT_STAGGER_MS = 18;

/** Contacts follow their accounts a little later, so a layout change reads as a hand pulling the graph along. */
const CONTACT_LAG_MS = 90;

const CONTACT_STAGGER_MS = 14;

const GUIDE_FADE_MS = 450;

const MAX_PIXEL_RATIO = 2;

const GUIDE_REST = 0.01;

const LINK_ALPHA = 0.22;

const GUIDE_ALPHA = 0.1;

const PREVIEW_ALPHA = 0.5;

const SELECTED_ALPHA = 0.9;

const LINK_WIDTH = 1.1;

const PREVIEW_WIDTH = 1.5;

const SELECTED_WIDTH = 1.8;

type MovingNode = {
  id: string;
  kind: NodeKind;
  element: HTMLElement;
  halfWidth: number;
  halfHeight: number;
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delay: number;
};

type GuideLevels = Record<LayoutId, number>;

type EngineState = {
  canvas: HTMLCanvasElement;
  pen: CanvasRenderingContext2D;
  nodes: MovingNode[];
  byId: Map<string, MovingNode>;
  stage: Box;
  layout: LayoutId;
  arrangements: Map<LayoutId, Arrangement>;
  guideLevel: GuideLevels;
  guideGoal: GuideLevels;
  selectedId: string | null;
  previewId: string | null;
  ink: string;
  accent: string;
  isLive: boolean;
  isRevealed: boolean;
  frame: number;
  startedAt: number;
  lastTick: number;
};

export type GraphEngine = {
  setLayout: (layout: LayoutId, shouldGlide: boolean) => void;
  setHighlight: (selectedId: string | null, previewId: string | null) => void;
  setLive: (isLive: boolean) => void;
  dispose: () => void;
};

function clamp01(value: number) {
  const atLeastZero = Math.max(value, 0);
  return Math.min(atLeastZero, 1);
}

function easeInOut(progress: number) {
  if (progress < 0.5) {
    return 4 * progress * progress * progress;
  }
  const mirrored = -2 * progress + 2;
  return 1 - (mirrored * mirrored * mirrored) / 2;
}

function levelsOf(layout: LayoutId): GuideLevels {
  const levels = { cluster: 0, rings: 0, grid: 0, orbit: 0, radial: 0 };
  levels[layout] = 1;
  return levels;
}

function delayOf(kind: NodeKind, index: number) {
  if (kind === 'account') {
    return index * ACCOUNT_STAGGER_MS;
  }
  return CONTACT_LAG_MS + index * CONTACT_STAGGER_MS;
}

function nodesOf(plane: HTMLElement) {
  const nodes: MovingNode[] = [];
  const counts = { account: 0, contact: 0 };
  for (const seed of GRAPH_NODES) {
    const selector = `[data-node="${seed.id}"]`;
    const element = plane.querySelector<HTMLElement>(selector);
    if (!element) {
      continue;
    }
    const index = counts[seed.kind];
    counts[seed.kind] += 1;
    nodes.push({
      id: seed.id,
      kind: seed.kind,
      element,
      halfWidth: 0,
      halfHeight: 0,
      x: 0,
      y: 0,
      fromX: 0,
      fromY: 0,
      toX: 0,
      toY: 0,
      delay: delayOf(seed.kind, index),
    });
  }
  return nodes;
}

function readColors(state: EngineState) {
  const style = getComputedStyle(state.canvas);
  const accent = style.getPropertyValue('--primary').trim();
  state.ink = style.color;
  state.accent = accent || style.color;
}

function place(node: MovingNode) {
  const x = node.x - node.halfWidth;
  const y = node.y - node.halfHeight;
  node.element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
}

function strokeGuide(pen: CanvasRenderingContext2D, guide: Guide) {
  pen.beginPath();
  if (guide.kind === 'ellipse') {
    pen.ellipse(guide.x, guide.y, guide.rx, guide.ry, 0, 0, Math.PI * 2);
  } else {
    pen.moveTo(guide.x1, guide.y1);
    pen.lineTo(guide.x2, guide.y2);
  }
  pen.stroke();
}

function drawGuides(state: EngineState) {
  const { pen } = state;
  pen.strokeStyle = state.ink;
  pen.lineWidth = 1;
  for (const id of LAYOUT_IDS) {
    const level = state.guideLevel[id];
    if (level < GUIDE_REST) {
      continue;
    }
    pen.globalAlpha = level * GUIDE_ALPHA;
    const arrangement = state.arrangements.get(id);
    for (const guide of arrangement?.guides ?? []) {
      strokeGuide(pen, guide);
    }
  }
}

function isLinkOf(link: GraphLink, id: string | null) {
  if (id === null) {
    return false;
  }
  const isAccount = link.accountId === id;
  const isContact = link.contactId === id;
  return isAccount || isContact;
}

function strokeLinks(
  state: EngineState,
  links: GraphLink[],
  color: string,
  alpha: number,
  width: number
) {
  const { pen } = state;
  pen.strokeStyle = color;
  pen.globalAlpha = alpha;
  pen.lineWidth = width;
  pen.beginPath();
  for (const link of links) {
    const account = state.byId.get(link.accountId);
    const contact = state.byId.get(link.contactId);
    if (!account || !contact) {
      continue;
    }
    pen.moveTo(account.x, account.y);
    pen.lineTo(contact.x, contact.y);
  }
  pen.stroke();
}

function draw(state: EngineState) {
  const { pen, stage } = state;
  pen.globalAlpha = 1;
  pen.lineCap = 'round';
  pen.clearRect(0, 0, stage.width, stage.height);
  drawGuides(state);
  const selected = GRAPH_LINKS.filter((link) =>
    isLinkOf(link, state.selectedId)
  );
  const previewed = GRAPH_LINKS.filter((link) =>
    isLinkOf(link, state.previewId)
  );
  const quiet = GRAPH_LINKS.filter((link) => !selected.includes(link));
  strokeLinks(state, quiet, state.ink, LINK_ALPHA, LINK_WIDTH);
  strokeLinks(state, previewed, state.accent, PREVIEW_ALPHA, PREVIEW_WIDTH);
  strokeLinks(state, selected, state.accent, SELECTED_ALPHA, SELECTED_WIDTH);
  pen.globalAlpha = 1;
}

function reveal(state: EngineState) {
  if (state.isRevealed) {
    return;
  }
  state.isRevealed = true;
  for (const node of state.nodes) {
    node.element.style.visibility = 'visible';
  }
}

function settle(state: EngineState) {
  const arrangement = state.arrangements.get(state.layout);
  for (const node of state.nodes) {
    const spot = arrangement?.places.get(node.id);
    if (spot) {
      node.x = spot.x;
      node.y = spot.y;
    }
    node.fromX = node.x;
    node.fromY = node.y;
    node.toX = node.x;
    node.toY = node.y;
    place(node);
  }
  state.guideLevel = { ...state.guideGoal };
  draw(state);
  reveal(state);
}

function measure(state: EngineState) {
  const box = state.canvas.getBoundingClientRect();
  const hasRoom = box.width > 0 && box.height > 0;
  if (!hasRoom) {
    return;
  }
  const devicePixelRatio = window.devicePixelRatio || 1;
  const pixelRatio = Math.min(devicePixelRatio, MAX_PIXEL_RATIO);
  state.stage = { width: box.width, height: box.height };
  state.canvas.width = Math.round(box.width * pixelRatio);
  state.canvas.height = Math.round(box.height * pixelRatio);
  state.pen.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  for (const id of LAYOUT_IDS) {
    state.arrangements.set(id, arrangementOf(id, state.stage));
  }
  for (const node of state.nodes) {
    node.halfWidth = node.element.offsetWidth / 2;
    node.halfHeight = node.element.offsetHeight / 2;
  }
  settle(state);
}

function tick(state: EngineState, now: number) {
  const elapsed = now - state.startedAt;
  const sinceLast = Math.max(now - state.lastTick, 0);
  state.lastTick = now;
  let isMoving = false;
  for (const node of state.nodes) {
    const raw = (elapsed - node.delay) / GLIDE_MS;
    const progress = clamp01(raw);
    const eased = easeInOut(progress);
    node.x = node.fromX + (node.toX - node.fromX) * eased;
    node.y = node.fromY + (node.toY - node.fromY) * eased;
    place(node);
    if (progress < 1) {
      isMoving = true;
    }
  }
  const fadeStep = sinceLast / GUIDE_FADE_MS;
  let isFading = false;
  for (const id of LAYOUT_IDS) {
    const goal = state.guideGoal[id];
    const level = state.guideLevel[id];
    const gap = goal - level;
    const size = Math.min(Math.abs(gap), fadeStep);
    const next = level + Math.sign(gap) * size;
    const remaining = Math.abs(goal - next);
    const isArrived = remaining <= GUIDE_REST;
    if (isArrived) {
      state.guideLevel[id] = goal;
      continue;
    }
    state.guideLevel[id] = next;
    isFading = true;
  }
  draw(state);
  if (isMoving || isFading) {
    state.frame = requestAnimationFrame((next) => tick(state, next));
    return;
  }
  state.frame = 0;
}

function wake(state: EngineState) {
  const isAsleep = state.frame === 0;
  if (!state.isLive || !isAsleep) {
    return;
  }
  const now = performance.now();
  state.lastTick = now;
  state.frame = requestAnimationFrame((next) => tick(state, next));
}

function setLayout(state: EngineState, layout: LayoutId, shouldGlide: boolean) {
  state.layout = layout;
  state.guideGoal = levelsOf(layout);
  const arrangement = state.arrangements.get(layout);
  const wantsGlide = shouldGlide && state.isLive;
  const canGlide = wantsGlide && arrangement !== undefined;
  if (!canGlide) {
    cancelAnimationFrame(state.frame);
    state.frame = 0;
    settle(state);
    return;
  }
  for (const node of state.nodes) {
    const spot = arrangement.places.get(node.id);
    node.fromX = node.x;
    node.fromY = node.y;
    node.toX = spot?.x ?? node.x;
    node.toY = spot?.y ?? node.y;
  }
  state.startedAt = performance.now();
  wake(state);
}

function setLive(state: EngineState, isLive: boolean) {
  state.isLive = isLive;
  if (isLive) {
    return;
  }
  cancelAnimationFrame(state.frame);
  state.frame = 0;
  settle(state);
}

function setHighlight(
  state: EngineState,
  selectedId: string | null,
  previewId: string | null
) {
  state.selectedId = selectedId;
  state.previewId = previewId;
  const isRunning = state.frame !== 0;
  if (!isRunning) {
    draw(state);
  }
}

/**
 * The links and the guides of the graph are drawn on one canvas, and every node is a real button
 * the engine moves with a transform. Frames are asked for only while a layout change is gliding:
 * at rest nothing runs, and a change while the graph is off screen or under reduced motion lands at once.
 */
export function createGraphEngine(
  canvas: HTMLCanvasElement,
  plane: HTMLElement,
  layout: LayoutId
): GraphEngine | null {
  const pen = canvas.getContext('2d');
  if (!pen) {
    return null;
  }
  const nodes = nodesOf(plane);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const state: EngineState = {
    canvas,
    pen,
    nodes,
    byId,
    stage: { width: 0, height: 0 },
    layout,
    arrangements: new Map(),
    guideLevel: levelsOf(layout),
    guideGoal: levelsOf(layout),
    selectedId: null,
    previewId: null,
    ink: 'currentcolor',
    accent: 'currentcolor',
    isLive: false,
    isRevealed: false,
    frame: 0,
    startedAt: 0,
    lastTick: 0,
  };
  readColors(state);

  function onResize() {
    measure(state);
  }

  function onTheme() {
    readColors(state);
    draw(state);
  }

  measure(state);
  const sizeObserver = new ResizeObserver(onResize);
  const themeObserver = new MutationObserver(onTheme);
  sizeObserver.observe(canvas);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme'],
  });

  return {
    setLayout: (next, shouldGlide) => setLayout(state, next, shouldGlide),
    setHighlight: (selectedId, previewId) =>
      setHighlight(state, selectedId, previewId),
    setLive: (isLive) => setLive(state, isLive),
    dispose() {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
      sizeObserver.disconnect();
      themeObserver.disconnect();
    },
  };
}
