const FRAMES_PER_SECOND = 30;

const FRAME_MS = 1000 / FRAMES_PER_SECOND;

/**
 * The timer between two frames ends this long before the next one is due, so the frame it asks for
 * lands on the screen refresh that is due and not on the one after.
 */
const REFRESH_LEAD_MS = 5;

const TIMER_MS = FRAME_MS - REFRESH_LEAD_MS;

/** A frame that comes late, after a long task, moves the picture no further than this long would. */
const MAX_STEP_S = 0.05;

/** What a frame answers while the picture still moves: the next one comes as soon as the cap allows. */
export const NEXT_FRAME = 0;

/** What a frame answers once the picture has come to rest: nothing is asked for until `wake`. */
export const AT_REST = Number.POSITIVE_INFINITY;

/** Draws one frame, `seconds` after the last one, and answers how many milliseconds it can wait for the next. */
export type FrameHandler = (seconds: number, now: number) => number;

export type FrameLoop = {
  start: () => void;
  stop: () => void;
  wake: () => void;
};

/**
 * Frames at thirty a second at most. Between two frames there is one timer and no animation frame,
 * so a 120 Hz screen does not run four rounds of main-thread work for one frame drawn. Stopped or
 * at rest, the loop holds no timer and asks for no frame.
 */
export function createFrameLoop(onFrame: FrameHandler): FrameLoop {
  let frame = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let isStarted = false;
  let lastFrameAt = 0;

  function clearPending() {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    frame = 0;
    timer = undefined;
  }

  function askForFrame() {
    timer = undefined;
    frame = requestAnimationFrame(tick);
  }

  function schedule(wait: number) {
    clearPending();
    const now = performance.now();
    const sinceFrame = now - lastFrameAt;
    const untilCap = TIMER_MS - sinceFrame;
    const delay = Math.max(wait, untilCap);
    if (delay <= 0) {
      askForFrame();
      return;
    }
    timer = setTimeout(askForFrame, delay);
  }

  function tick(now: number) {
    frame = 0;
    const elapsedMs = now - lastFrameAt;
    const elapsed = elapsedMs / 1000;
    const forward = Math.max(0, elapsed);
    const seconds = Math.min(forward, MAX_STEP_S);
    lastFrameAt = now;
    const wait = onFrame(seconds, now);
    const isResting = wait === AT_REST;
    if (isResting || !isStarted) {
      return;
    }
    schedule(wait);
  }

  function start() {
    if (isStarted) {
      return;
    }
    const now = performance.now();
    isStarted = true;
    lastFrameAt = now - FRAME_MS;
    schedule(NEXT_FRAME);
  }

  function stop() {
    isStarted = false;
    clearPending();
  }

  function wake() {
    const isFrameComing = frame !== 0;
    if (!isStarted || isFrameComing) {
      return;
    }
    schedule(NEXT_FRAME);
  }

  return { start, stop, wake };
}
