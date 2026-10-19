# MCP connector (BuyAuto in Claude, ChatGPT and other AI assistants)

BuyAuto runs a public, read-only [Model Context Protocol](https://modelcontextprotocol.io) server at
**https://www.buyauto.ch/mcp**. An assistant that has it connected can search the live offers,
open a listing, look up the published takeover fees and walk someone through passing on a lease.
It cannot message sellers, create listings or change anything.

## Tools

| Tool | Reads | For |
| --- | --- | --- |
| `search_listings` | live inventory via `searchListingsOrThrow` (same Kaufart rule as `/suche`) | filters for rate, months left, Kaution, kilometres left, price, km, year, fuel, gearbox, body, canton, brand, model, keywords |
| `get_listing` | `listings_public` + `get_public_garages` | one listing by id or buyauto.ch URL, with the contact link |
| `get_takeover_costs` | `facts.ts`, `leasingCompanies.ts`, `brandLenders.ts` | lender fees and cantonal fees, each with source and Stand |
| `get_handover_steps` | the six steps of `/leasingvertrag-uebertragen` | passing on a lease, with links to the listing form, guide and prices |

All tools are annotated `readOnlyHint: true`, `destructiveHint: false`, `openWorldHint: false`.

## What a listing exposes

`src/lib/mcp/listingOutput.ts` builds every listing from an allow-list. It never returns private
sellers' names or avatars, user-id fields, VINs, plan, payment or Stripe fields. Photos are the same
public storage URLs the listing page uses; their folder name is the uploader's account id, as on the
site. Seller descriptions lose e-mail addresses (also written as "(at)"), phone numbers, links and
bare domains, social handles and VINs typed into the text (best effort; dates, prices and mileage
stay). Locations are reduced to town and canton ("Kanton Zürich" when only the canton is known).
A lease takeover also carries its purchase price when the seller states one, as the listing page
shows it. Links carry `?via=mcp` (no UTM, so the assistant's own referrer still feeds GA4's AI
channel; the parameter shows up in `page_location`).

## Limits and caching

- Request bodies are capped at 64 KB (413) and JSON-RPC batches at 5 messages (400).
- Invalid JSON gets a JSON-RPC parse error (-32700); a request id of `null` is refused (-32600).
- After `initialize`, an unknown `MCP-Protocol-Version` header gets 400, as the spec asks.
- `liveData.ts` keeps each search, listing, garage and brand list for 60 seconds in the function's
  memory (per serverless instance, at most 200 entries each; failed reads are not kept). A listing
  that was just paused or sold can therefore still show for up to a minute.
- There is no rate limit in the app. If the logs show abuse, add a Vercel Firewall rate-limit rule
  for `/mcp` and `/api/mcp`, and set it generously: Claude's and ChatGPT's servers call from shared
  IP ranges, so one IP stands for many users.

## Files

- `src/pages/api/mcp.ts`: HTTP endpoint (Streamable HTTP, stateless, JSON responses; GET answers 405; body limit, parse errors and the protocol header). `/mcp` is rewritten to it in `next.config.mjs`.
- `src/lib/mcp/protocol.ts`: JSON-RPC and MCP core (initialize, ping, tools/list, tools/call, batches capped at 5).
- `src/lib/mcp/buyautoServer.ts`: server name, version, instructions for the model, logging.
- `src/lib/mcp/tools.ts`: the tool list; one module per tool (`searchListings.ts`, `getListing.ts`, `takeoverCosts.ts`, `handoverSteps.ts`), shared `args.ts`, `brands.ts`, `schemas.ts`, `dataSource.ts`, `liveData.ts`.
- `public/buyauto-connector-icon.png`: 512 × 512 icon (`serverInfo.icons`, directory listings).
- `scripts/test-mcp.ts`: offline tests with fixtures, including each tool's output against its `outputSchema`.

## Testing

```bash
npx tsx scripts/test-mcp.ts
npx @modelcontextprotocol/inspector --cli https://www.buyauto.ch/mcp --transport http --method tools/list
npx @modelcontextprotocol/inspector --cli https://www.buyauto.ch/mcp --transport http --method tools/call --tool-name search_listings --tool-arg brand=BMW
```

For a preview deployment, replace the host with the preview URL.

`test-mcp.ts` covers everything below the HTTP layer. Check the endpoint itself against a running
server (`npm run dev`, then `http://localhost:3000/mcp`):

```bash
curl -s -X POST http://localhost:3000/mcp -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0",'   # 400, code -32700
curl -s -X POST http://localhost:3000/mcp -H 'Content-Type: application/json' \
  -H 'MCP-Protocol-Version: 2099-01-01' -d '{"jsonrpc":"2.0","id":1,"method":"ping"}'                  # 400, unsupported version
curl -s -X POST http://localhost:3000/mcp -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"notifications/initialized"}' -w '%{http_code}\n'                      # 202, no body
```

In Claude: Customize → Connectors → add a custom connector with the URL (no authentication).
In ChatGPT: chatgpt.com/plugins → plus button → Add custom MCP server (developer mode; availability depends on plan and region).

## Logs and usage

Every tool call logs one line, `[mcp] <tool> ok|error <ms>ms args=<filter names>`, in the Vercel
runtime logs (filter names only, never values). Visits that came through the connector are landing
pages with `via=mcp` in GA4.

## Changing the tools

- Keep every tool read-only unless OAuth is added; a write tool (e.g. messaging a seller) needs the user's own login.
- Bump `BUYAUTO_MCP_VERSION` in `buyautoServer.ts` when tools, schemas or annotations change.
- ChatGPT freezes published tool metadata: changed tools, schemas or annotations need a new app version and review. Renaming or removing a tool is a breaking change.
- The Claude directory re-syncs tools from the server; keep names stable.
- Numbers come from `facts.ts` and the live inventory only, as on the site.
