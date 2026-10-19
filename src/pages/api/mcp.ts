import type { NextApiRequest, NextApiResponse } from "next";
import { buyAutoMcpConfig } from "@/lib/mcp/buyautoServer";
import { JSONRPC_ERRORS, SUPPORTED_PROTOCOL_VERSIONS, handleMcpBody, parseErrorBody } from "@/lib/mcp/protocol";

/**
 * BuyAuto MCP connector endpoint (Streamable HTTP, stateless, JSON responses).
 * Public URL: https://www.buyauto.ch/mcp (rewritten here by next.config.mjs).
 *
 * Read-only and without authentication: it serves the same public listing
 * data as the site. No sessions, so GET (server-sent events) and DELETE answer
 * 405 as the transport allows. CORS is open for browser-based MCP clients;
 * there are no cookies or credentials to protect. GET stays in the CORS
 * methods so a browser client sees the 405 instead of a CORS failure.
 */

// The body is read here (not by Next's parser) so malformed JSON gets a JSON-RPC parse error.
export const config = {
  api: { bodyParser: false },
};

const MAX_BODY_BYTES = 64 * 1024;

const server = buyAutoMcpConfig();

function setCommonHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-ID"
  );
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id, MCP-Protocol-Version");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
}

function jsonRpcError(code: number, message: string) {
  return { jsonrpc: "2.0", id: null, error: { code, message } };
}

/** Raw request body as text, or null when it exceeds the limit. */
async function readBody(req: NextApiRequest, limit: number): Promise<string | null> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string);
    size += buf.length;
    if (size > limit) return null;
    chunks.push(buf);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCommonHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.status(405).json({
      error: "method_not_allowed",
      message:
        "This is BuyAuto's MCP server for AI assistants (Streamable HTTP, POST only). Add https://www.buyauto.ch/mcp as a custom connector in your assistant.",
    });
    return;
  }

  let raw: string | null;
  try {
    raw = await readBody(req, MAX_BODY_BYTES);
  } catch {
    res.status(400).json(parseErrorBody());
    return;
  }
  if (raw === null) {
    res.status(413).json(jsonRpcError(JSONRPC_ERRORS.INVALID_REQUEST, "Request body too large (64 KB at most)."));
    return;
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    res.status(400).json(parseErrorBody());
    return;
  }
  if (body === null || typeof body !== "object") {
    res.status(400).json(jsonRpcError(JSONRPC_ERRORS.INVALID_REQUEST, "Expected a JSON-RPC 2.0 message."));
    return;
  }

  // After initialize, clients send the negotiated revision on every request; an unknown one gets 400
  // (spec). initialize itself is exempt, as in the official SDK: that is where the revision is agreed.
  const versionHeader = req.headers["mcp-protocol-version"];
  const version = Array.isArray(versionHeader) ? versionHeader[0] : versionHeader;
  const messages: unknown[] = Array.isArray(body) ? body : [body];
  const isInitialize = messages.some((m) => typeof m === "object" && m !== null && (m as { method?: unknown }).method === "initialize");
  if (version && !isInitialize && !(SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(version)) {
    res
      .status(400)
      .json(
        jsonRpcError(
          JSONRPC_ERRORS.INVALID_REQUEST,
          `Unsupported MCP-Protocol-Version: ${version}. Supported: ${SUPPORTED_PROTOCOL_VERSIONS.join(", ")}.`
        )
      );
    return;
  }

  try {
    const reply = await handleMcpBody(body, server);
    if (reply.status === 202) {
      res.status(202).end();
      return;
    }
    res.status(reply.status).json(reply.body);
  } catch (error) {
    console.error("[mcp] unexpected error:", error instanceof Error ? error.message : error);
    res.status(500).json(jsonRpcError(JSONRPC_ERRORS.INTERNAL_ERROR, "Internal error in BuyAuto's MCP server. Try again in a moment."));
  }
}
