/**
 * The BuyAuto connector's tools (MCP). All of them read public data only:
 * live listings through the same engine as /suche and /fahrzeug/[id], and the
 * sourced facts of the cost page (facts.ts, leasingCompanies.ts,
 * brandLenders.ts). Nothing here writes to the database or contacts a seller.
 *
 * Data access is injected (ListingDataSource) so scripts/test-mcp.ts can run
 * the tools against fixtures; the live source is in ./liveData.ts.
 */
import type { ListingDataSource } from "@/lib/mcp/dataSource";
import { LISTING_DETAIL_SCHEMA } from "@/lib/mcp/schemas";
import { runSearch, SEARCH_INPUT_SCHEMA, SEARCH_OUTPUT_SCHEMA } from "@/lib/mcp/searchListings";
import { runGetListing } from "@/lib/mcp/getListing";
import { COSTS_INPUT_SCHEMA, COSTS_OUTPUT_SCHEMA, runTakeoverCosts } from "@/lib/mcp/takeoverCosts";
import { HANDOVER_OUTPUT_SCHEMA, runHandoverSteps } from "@/lib/mcp/handoverSteps";
import type { McpTool } from "@/lib/mcp/protocol";

export type { ListingDataSource } from "@/lib/mcp/dataSource";
export { matchBrands, matchesQuery } from "@/lib/mcp/brands";
export { parseSearchArgs, searchPageUrl } from "@/lib/mcp/searchListings";
export { listingIdFromInput } from "@/lib/mcp/getListing";

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

export function createBuyAutoTools(data: ListingDataSource): McpTool[] {
  return [
    {
      definition: {
        name: "search_listings",
        title: "Search BuyAuto listings",
        description:
          "Searches the live offers on BuyAuto (buyauto.ch), the Swiss marketplace for car lease takeovers (Leasingübernahmen). " +
          "In a lease takeover the buyer continues someone's running leasing contract at its monthly rate for the remaining months; the leasing company must approve the new lessee. " +
          "Some listings are direct purchases with a price instead. Filters: brand, model, monthly rate, remaining months, deposit (Kaution), purchase price, mileage, year, fuel, gearbox, body type, canton. " +
          "Returns up to 20 listings per page with key facts (CHF) and the buyauto.ch link to each. Featured listings are a paid placement; they come first in the default sort and are flagged.",
        inputSchema: SEARCH_INPUT_SCHEMA,
        outputSchema: SEARCH_OUTPUT_SCHEMA,
        annotations: READ_ONLY,
      },
      handler: (args) => runSearch(args, data),
    },
    {
      definition: {
        name: "get_listing",
        title: "Get a BuyAuto listing",
        description:
          "Returns the full details of one live BuyAuto listing: monthly rate, remaining months, deposit and kilometres left (lease takeover) or price (direct purchase), vehicle data, the seller's description (contact details removed), photos and the buyauto.ch page where the buyer contacts the seller. " +
          "Takes the id from search_listings or a buyauto.ch/fahrzeug/… link.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Listing id (UUID) from search_listings, or a buyauto.ch/fahrzeug/… URL." },
          },
          required: ["id"],
          additionalProperties: false,
        },
        outputSchema: {
          type: "object",
          properties: { listing: LISTING_DETAIL_SCHEMA, notes: { type: "array", items: { type: "string" } } },
          required: ["listing", "notes"],
        },
        annotations: READ_ONLY,
      },
      handler: (args) => runGetListing(args, data),
    },
    {
      definition: {
        name: "get_takeover_costs",
        title: "Lease takeover costs in Switzerland",
        description:
          "Returns the published fees for transferring a Swiss car leasing contract to a new person: each leasing company's takeover fee (Cembra, CA Auto Finance, AMAG Leasing, BMW, Porsche, Mercedes-Benz, Multilease, BANK-now) and the cantonal road traffic office fees for the new registration document and plates, each with its source and date, as researched for BuyAuto's cost page. " +
          "Optional: leasing_company or car brand (for that lender's credit check and process notes), canton (for one canton's fees).",
        inputSchema: COSTS_INPUT_SCHEMA,
        outputSchema: COSTS_OUTPUT_SCHEMA,
        annotations: READ_ONLY,
      },
      handler: (args) => runTakeoverCosts(args),
    },
    {
      definition: {
        name: "get_handover_steps",
        title: "How to hand over a lease on BuyAuto",
        description:
          "Returns the steps for someone who wants to pass their running car lease on to a new person in Switzerland (from checking the contract to the handover report), what the BuyAuto listing form asks for, and the links to create a listing, the guide, the prices and the page for garages. " +
          "Use it when someone wants to get out of their lease or sell a leased car.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        outputSchema: HANDOVER_OUTPUT_SCHEMA,
        annotations: READ_ONLY,
      },
      handler: async (args) => runHandoverSteps(args),
    },
  ];
}
