import type { NextApiRequest, NextApiResponse } from "next";
import { buyAutoMcpConfig } from "@/lib/mcp/buyautoServer";
import { handleMcpBody, parseErrorBody } from "@/lib/mcp/protocol";

/**
 * BuyAuto MCP connector endpoint (Streamable HTTP, stateless, JSON responses).
 * Public URL: https://www.buyauto.ch/mcp (rewritten here by next.config.mjs).
 *
 * Read-only and without authentication: it serves the same public listing
 * data as the site. No sessions, so GET (server-sent events) and DELETE answer
 * 405 as the transport allows. CORS is open for browser-based MCP clients;
 * there are no cookies or credentials to protect.
 */

export const config = {
  api: { bodyParser: { sizeLimit: "64kb" } },
};

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

  let body: unknown = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json(parseErrorBody());
      return;
    }
  }
  if (body === undefined || body === null || body === "") {
    res.status(400).json(parseErrorBody());
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
    res.status(500).json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32603, message: "Internal error in BuyAuto's MCP server. Try again in a moment." },
    });
  }
}
