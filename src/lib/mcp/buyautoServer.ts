/**
 * The BuyAuto MCP connector: server identity, guidance for the model and the
 * tool set, wired to live data. Served at https://www.buyauto.ch/mcp
 * (rewrite to /api/mcp, see next.config.mjs).
 */
import type { McpServerConfig } from "@/lib/mcp/protocol";
import { SITE_URL } from "@/lib/mcp/listingOutput";
import { liveListingData } from "@/lib/mcp/liveData";
import { createBuyAutoTools } from "@/lib/mcp/tools";

export const BUYAUTO_MCP_VERSION = "1.0.0";

// The first 512 characters carry the essentials (some clients truncate).
export const BUYAUTO_MCP_INSTRUCTIONS =
  "BuyAuto (buyauto.ch) is a Swiss marketplace for car lease takeovers (Leasingübernahmen): someone passes on a running leasing contract and the person taking over continues it at the listed monthly rate for the remaining months, once the leasing company has checked and approved them. Some listings are direct purchases. Prices are in CHF. " +
  "search_listings finds live offers; get_listing returns one listing with the buyauto.ch page where buyers contact the seller; get_takeover_costs lists the published fees with sources; get_handover_steps covers passing on a lease. " +
  "The connector only reads public data: it cannot message sellers, create listings or reserve a car.";

export function buyAutoMcpConfig(): McpServerConfig {
  return {
    name: "buyauto",
    title: "BuyAuto",
    version: BUYAUTO_MCP_VERSION,
    websiteUrl: SITE_URL,
    icons: [{ src: `${SITE_URL}/buyauto-connector-icon.png`, mimeType: "image/png", sizes: ["512x512"] }],
    instructions: BUYAUTO_MCP_INSTRUCTIONS,
    tools: createBuyAutoTools(liveListingData),
    onToolCall: ({ tool, ms, isError, argKeys }) => {
      // Filter names only, no values: Vercel runtime logs show usage without search contents.
      console.log(`[mcp] ${tool} ${isError ? "error" : "ok"} ${ms}ms args=${argKeys.join(",") || "-"}`);
    },
  };
}
