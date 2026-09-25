# AI Traffic Tracking (GEO measurement)

How BuyAuto measures visits that arrive from AI assistants (ChatGPT, Perplexity,
Claude, Copilot, Gemini, You.com), and how to read them in GA4.

## What the site does

Nothing extra. The custom `ai_referral` event (and `src/lib/analytics/aiReferral.ts`)
was removed in the Sept 2026 GA4 rebuild: GA4's built-in default channel group now
has its own AI-assistant channel, and a custom event only duplicated it. AI visits
are attributed through the normal referrer on the landing page view, sent by
`src/lib/analytics.ts` (see `docs/analytics-events.md`).

Limitations that still apply:

- ChatGPT sometimes opens links with `Referrer-Policy` stripped or via the
  `utm_source=chatgpt.com` parameter instead of a referrer. The channel-group regex
  below catches the UTM case; a missing referrer is unmeasurable and lands in Direct.
- Consent Mode v2 applies: before the visitor answers the cookie banner the landing
  page view is held; it is released (cookied or cookieless) when they choose.

## GA4 setup: custom "AI" channel group

GA4 UI → **Verwaltung (Admin) → Datenanzeige (Data display) → Channelgruppen
(Channel groups)**:

1. Open the default channel group and click **Kopie erstellen** (Create copy) — the
   default group itself cannot be edited.
2. Name the copy e.g. `Standard + AI`.
3. **Neuen Channel hinzufügen** (Add new channel), name: `AI`.
4. Condition — **Quelle** (Source) *stimmt mit regulärem Ausdruck überein* (matches
   regex):

   ```
   chatgpt|openai|perplexity|claude|copilot|gemini
   ```

5. Drag the `AI` channel **above** `Referral` (and above `Organic Search`) in the
   channel order — first match wins.
6. Save. Channel groups apply from creation onward; they do not reclassify history.
   To use it in reports, switch the dimension "Standard-Channelgruppe" to your copy.

Add `you\.com` to the regex only if You.com referrals actually appear; the bare word
"you" would over-match other sources.

## Reading the data

- **Berichte → Akquisition → Neu generierte Nutzer** with your custom channel group
  as primary dimension → the `AI` row is assistant-driven traffic.
- **Explorativ**: dimension *Sitzungsquelle* (session source), filtered to the AI
  hosts above, metrics Sitzungen / Schlüsselereignisse (`listing_published`,
  `purchase`), to see which assistant sends users who actually convert.
