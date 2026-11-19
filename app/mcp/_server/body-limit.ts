import { jsonRpcRefusalOf } from './json-rpc-error';

/*
 * A client message is a tool name with short arguments, a few kilobytes at most. Anything far larger is
 * refused before it is parsed, so a runaway or hostile client cannot make the server read megabytes.
 */
const MAX_BODY_BYTES = 64 * 1024;

const PAYLOAD_TOO_LARGE_STATUS = 413;

function declaredLengthOf(request: Request) {
  const header = request.headers.get('content-length');
  if (header === null) {
    return null;
  }
  return Number(header);
}

function joinedOf(chunks: Uint8Array[], totalBytes: number) {
  const joined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return joined;
}

/** Reads a body that declares no length, and stops as soon as it passes the limit. */
async function cappedBodyOf(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      return joinedOf(chunks, receivedBytes);
    }
    receivedBytes += value.byteLength;
    if (receivedBytes > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
}

/**
 * The request to hand to the MCP server, or null when its body is over the limit. A body without a
 * declared length is read here under the cap, so the request is rebuilt around the bytes already read.
 */
export async function boundedRequestOf(request: Request) {
  if (!request.body) {
    return request;
  }
  const declaredLength = declaredLengthOf(request);
  if (declaredLength !== null) {
    const isWithinLimit = declaredLength <= MAX_BODY_BYTES;
    if (isWithinLimit) {
      return request;
    }
    return null;
  }
  const body = await cappedBodyOf(request.body);
  if (!body) {
    return null;
  }
  return new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body,
  });
}

export function payloadTooLargeResponse() {
  const limitInKilobytes = MAX_BODY_BYTES / 1024;
  const message = `Request body is over ${limitInKilobytes} KB.`;
  return jsonRpcRefusalOf(PAYLOAD_TOO_LARGE_STATUS, message);
}
