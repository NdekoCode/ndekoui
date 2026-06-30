import type { createMcpHandler } from 'mcp-handler';

type InitializeServer = Parameters<typeof createMcpHandler>[0];

/** The SDK's server type, read from mcp-handler so the SDK package does not have to be a direct dependency. */
export type McpServer = Parameters<InitializeServer>[0];
