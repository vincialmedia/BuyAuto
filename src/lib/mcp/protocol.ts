/**
 * Minimal Model Context Protocol (MCP) server core: JSON-RPC 2.0 over the
 * Streamable HTTP transport in stateless JSON mode (no sessions, no SSE).
 *
 * Why hand-rolled instead of @modelcontextprotocol/sdk: the connector only
 * exposes read-only tools, which needs a small slice of the protocol
 * (initialize, ping, tools/list, tools/call). The SDK would add a zod bump and
 * a large dependency tree to the site for that. The HTTP adapter lives in
 * src/pages/api/mcp.ts; scripts/test-mcp.ts checks this module against the
 * spec (protocol revision 2025-11-25, with older revisions negotiated).
 */

export const SUPPORTED_PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"] as const;
export const LATEST_PROTOCOL_VERSION: string = SUPPORTED_PROTOCOL_VERSIONS[0];

export const JSONRPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

export type JsonRpcId = string | number;

export interface JsonRpcErrorObject {
  code: number;
  message: string;
  data?: unknown;
}

export type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: JsonRpcId; result: unknown }
  | { jsonrpc: "2.0"; id: JsonRpcId | null; error: JsonRpcErrorObject };

/** JSON Schema object as MCP transports it (inputSchema / outputSchema). */
export type JsonSchema = Record<string, unknown>;

export interface ToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: JsonSchema;
  outputSchema?: JsonSchema;
  annotations: ToolAnnotations;
}

export interface TextContent {
  type: "text";
  text: string;
}

export interface ToolResult {
  content: TextContent[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

export interface McpTool {
  definition: ToolDefinition;
  handler: (args: Record<string, unknown>) => Promise<ToolResult>;
}

export interface McpIcon {
  src: string;
  mimeType?: string;
  sizes?: string[];
}

export interface McpServerConfig {
  name: string;
  title: string;
  version: string;
  websiteUrl?: string;
  icons?: McpIcon[];
  /** Cross-tool guidance for the model; clients may show it to the model at connect time. */
  instructions?: string;
  tools: McpTool[];
  /** Called once per tools/call, for logging. Must not throw. */
  onToolCall?: (event: { tool: string; ms: number; isError: boolean; argKeys: string[] }) => void;
}

/** Thrown by tool handlers for bad arguments: becomes an isError result the model can act on. */
export class ToolInputError extends Error {}

/** Result helpers. Structured results also carry their JSON as text (spec: SHOULD, for older clients). */
export function toolResult(structured: Record<string, unknown>): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(structured) }], structuredContent: structured };
}

export function toolError(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

/** Pick the protocol revision: the client's when we support it, else our latest (the client decides). */
export function negotiateProtocolVersion(requested: unknown): string {
  if (typeof requested === "string" && (SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(requested)) {
    return requested;
  }
  return LATEST_PROTOCOL_VERSION;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidId(id: unknown): id is JsonRpcId {
  return (typeof id === "string" && id.length > 0) || (typeof id === "number" && Number.isFinite(id));
}

function errorResponse(id: JsonRpcId | null, code: number, message: string, data?: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: data === undefined ? { code, message } : { code, message, data } };
}

function resultResponse(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function toolsListResult(config: McpServerConfig) {
  return {
    tools: config.tools.map(({ definition }) => {
      const tool: Record<string, unknown> = {
        name: definition.name,
        title: definition.title,
        description: definition.description,
        inputSchema: definition.inputSchema,
        // annotations.title too: revision 2025-03-26 clients read the title from there.
        annotations: { title: definition.title, ...definition.annotations },
      };
      if (definition.outputSchema) tool.outputSchema = definition.outputSchema;
      return tool;
    }),
  };
}

async function callTool(config: McpServerConfig, id: JsonRpcId, params: unknown): Promise<JsonRpcResponse> {
  if (!isObject(params) || typeof params.name !== "string") {
    return errorResponse(id, JSONRPC_ERRORS.INVALID_PARAMS, "tools/call needs params.name (string).");
  }
  const tool = config.tools.find((t) => t.definition.name === params.name);
  if (!tool) {
    const names = config.tools.map((t) => t.definition.name).join(", ");
    return errorResponse(id, JSONRPC_ERRORS.INVALID_PARAMS, `Unknown tool: ${params.name}. Available tools: ${names}.`);
  }

  const rawArgs = params.arguments;
  if (rawArgs !== undefined && rawArgs !== null && !isObject(rawArgs)) {
    return resultResponse(id, toolError("Tool arguments must be a JSON object."));
  }
  const args = (rawArgs ?? {}) as Record<string, unknown>;

  const started = Date.now();
  let result: ToolResult;
  try {
    result = await tool.handler(args);
  } catch (error) {
    if (error instanceof ToolInputError) {
      result = toolError(error.message);
    } else {
      console.error(`[mcp] ${tool.definition.name} failed:`, error instanceof Error ? error.message : error);
      result = toolError(
        "BuyAuto's listing database did not answer. This is a temporary problem on BuyAuto's side; try the same request again in a moment."
      );
    }
  }

  try {
    config.onToolCall?.({
      tool: tool.definition.name,
      ms: Date.now() - started,
      isError: result.isError === true,
      argKeys: Object.keys(args).filter((k) => args[k] !== undefined && args[k] !== null),
    });
  } catch {
    // Logging must never break a tool call.
  }

  return resultResponse(id, result);
}

/**
 * Handle one JSON-RPC message. Returns the response, or null for messages that
 * get none (notifications and responses sent by the client).
 */
export async function handleMcpMessage(message: unknown, config: McpServerConfig): Promise<JsonRpcResponse | null> {
  if (!isObject(message) || message.jsonrpc !== "2.0") {
    const id = isObject(message) && isValidId(message.id) ? message.id : null;
    return errorResponse(id, JSONRPC_ERRORS.INVALID_REQUEST, "Expected a JSON-RPC 2.0 message.");
  }

  const hasMethod = typeof message.method === "string";
  const hasId = "id" in message && message.id !== undefined && message.id !== null;

  // A response from the client (to a server request we never send): nothing to answer.
  if (!hasMethod && ("result" in message || "error" in message)) return null;
  if (!hasMethod) {
    return errorResponse(isValidId(message.id) ? message.id : null, JSONRPC_ERRORS.INVALID_REQUEST, "Missing method.");
  }

  const method = message.method as string;

  // Notifications (no id) never get a response: notifications/initialized, cancelled, progress, …
  if (!hasId) return null;
  if (!isValidId(message.id)) {
    return errorResponse(null, JSONRPC_ERRORS.INVALID_REQUEST, "The id must be a non-empty string or a number.");
  }
  const id = message.id;
  const params = message.params;

  switch (method) {
    case "initialize": {
      const requested = isObject(params) ? params.protocolVersion : undefined;
      const serverInfo: Record<string, unknown> = { name: config.name, title: config.title, version: config.version };
      if (config.websiteUrl) serverInfo.websiteUrl = config.websiteUrl;
      if (config.icons?.length) serverInfo.icons = config.icons;
      const result: Record<string, unknown> = {
        protocolVersion: negotiateProtocolVersion(requested),
        capabilities: { tools: { listChanged: false } },
        serverInfo,
      };
      if (config.instructions) result.instructions = config.instructions;
      return resultResponse(id, result);
    }
    case "ping":
      return resultResponse(id, {});
    case "tools/list":
      return resultResponse(id, toolsListResult(config));
    case "tools/call":
      return callTool(config, id, params);
    // Not offered (no capability declared), answered empty so lenient clients that ask anyway don't fail.
    case "resources/list":
      return resultResponse(id, { resources: [] });
    case "resources/templates/list":
      return resultResponse(id, { resourceTemplates: [] });
    case "prompts/list":
      return resultResponse(id, { prompts: [] });
    case "logging/setLevel":
      return resultResponse(id, {});
    default:
      return errorResponse(id, JSONRPC_ERRORS.METHOD_NOT_FOUND, `Method not found: ${method}`);
  }
}

export interface McpHttpReply {
  /** 200 with a JSON body, or 202 Accepted with no body (only notifications/responses were sent). */
  status: 200 | 202 | 400;
  body?: unknown;
}

/** JSON-RPC batches (revision 2025-03-26 only) are capped so one request can't fan out into many database reads. */
export const MAX_BATCH_SIZE = 20;

/** Handle a parsed POST body: one message or (older clients) a batch array. */
export async function handleMcpBody(body: unknown, config: McpServerConfig): Promise<McpHttpReply> {
  if (Array.isArray(body)) {
    if (body.length === 0) {
      return { status: 400, body: errorResponse(null, JSONRPC_ERRORS.INVALID_REQUEST, "Empty batch.") };
    }
    if (body.length > MAX_BATCH_SIZE) {
      return {
        status: 400,
        body: errorResponse(null, JSONRPC_ERRORS.INVALID_REQUEST, `Batch too large: at most ${MAX_BATCH_SIZE} messages per request.`),
      };
    }
    const responses = (await Promise.all(body.map((m) => handleMcpMessage(m, config)))).filter(
      (r): r is JsonRpcResponse => r !== null
    );
    return responses.length ? { status: 200, body: responses } : { status: 202 };
  }

  const response = await handleMcpMessage(body, config);
  if (!response) return { status: 202 };
  return { status: 200, body: response };
}

/** JSON-RPC parse error body for an unparseable request. */
export function parseErrorBody(): JsonRpcResponse {
  return errorResponse(null, JSONRPC_ERRORS.PARSE_ERROR, "Parse error: the request body is not valid JSON.");
}
