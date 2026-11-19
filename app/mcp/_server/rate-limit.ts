import { jsonRpcRefusalOf } from './json-rpc-error';

/*
 * A coding session sends a few calls when it connects, then one per tool call. Forty a minute is well
 * above that and still stops an agent stuck in a loop. It is the same limit as the Vercel firewall rule
 * on /mcp, so a client meets one number whichever layer answers.
 *
 * The count lives in the memory of the running instance, with no database: a loop keeps landing on the
 * same warm instance, which is enough to catch it. The firewall rule stops it earlier, before any
 * function runs; this one is the fallback when that rule is off.
 */
const WINDOW_MS = 60_000;

const MAX_CALLS_PER_WINDOW = 40;

/** Past this many tracked addresses, the ones whose minute is over are dropped. */
const PRUNE_ABOVE = 5_000;

const TOO_MANY_REQUESTS_STATUS = 429;

const UNKNOWN_CLIENT = 'unknown';

type CallWindow = { startedAt: number; count: number };

const windowsByClient = new Map<string, CallWindow>();

/** Vercel overwrites `x-forwarded-for` with the address the request came from, so a client cannot pick its own. */
function clientKeyOf(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (!forwarded) {
    return UNKNOWN_CLIENT;
  }
  const [firstAddress] = forwarded.split(',');
  const address = firstAddress.trim();
  if (!address) {
    return UNKNOWN_CLIENT;
  }
  return address;
}

function isOver(window: CallWindow, now: number) {
  const endsAt = window.startedAt + WINDOW_MS;
  return now >= endsAt;
}

function pruneFinishedWindows(now: number) {
  const isCrowded = windowsByClient.size > PRUNE_ABOVE;
  if (!isCrowded) {
    return;
  }
  for (const [client, window] of windowsByClient) {
    if (isOver(window, now)) {
      windowsByClient.delete(client);
    }
  }
}

function currentWindowOf(client: string, now: number) {
  const existing = windowsByClient.get(client);
  const isStillOpen = existing !== undefined && !isOver(existing, now);
  if (isStillOpen) {
    return existing;
  }
  const fresh = { startedAt: now, count: 0 };
  windowsByClient.set(client, fresh);
  return fresh;
}

function secondsLeftIn(window: CallWindow, now: number) {
  const endsAt = window.startedAt + WINDOW_MS;
  const millisecondsLeft = endsAt - now;
  const secondsLeft = Math.ceil(millisecondsLeft / 1000);
  return Math.max(secondsLeft, 1);
}

function tooManyRequestsResponseOf(retryAfterSeconds: number) {
  const message = `Too many requests. Retry in ${retryAfterSeconds} seconds.`;
  const headers = { 'Retry-After': String(retryAfterSeconds) };
  return jsonRpcRefusalOf(TOO_MANY_REQUESTS_STATUS, message, headers);
}

/** Counts this call against its address, and returns the refusal when the address is over its minute. */
export function rateLimitedResponseOf(request: Request) {
  const now = Date.now();
  pruneFinishedWindows(now);
  const client = clientKeyOf(request);
  const window = currentWindowOf(client, now);
  window.count += 1;
  const isOverLimit = window.count > MAX_CALLS_PER_WINDOW;
  if (!isOverLimit) {
    return null;
  }
  const retryAfterSeconds = secondsLeftIn(window, now);
  return tooManyRequestsResponseOf(retryAfterSeconds);
}
