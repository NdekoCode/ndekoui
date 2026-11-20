/* JSON-RPC's code for a request the server refuses to process. */
const REFUSED_REQUEST_CODE = -32600;

/** A refusal MCP clients can read: the HTTP status says why, the JSON-RPC body says it in words. */
export function jsonRpcRefusalOf(
  status: number,
  message: string,
  headers: Record<string, string> = {}
) {
  const error = { code: REFUSED_REQUEST_CODE, message };
  const body = { jsonrpc: '2.0', error, id: null };
  return Response.json(body, { status, headers });
}
