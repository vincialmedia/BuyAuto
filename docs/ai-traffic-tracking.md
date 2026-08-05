# AI Traffic Tracking (GEO measurement)

How BuyAuto measures visits that arrive from AI assistants (ChatGPT, Perplexity,
Claude, Copilot, Gemini, You.com), and how to read them in GA4.

## What the site does

`src/lib/analytics/aiReferral.ts`, mounted via `GoogleAnalytics` (so it runs on every
page, once per page load):

1. On first load it checks `document.referrer` against these hosts (subdomains
   included): `chatgpt.com`, `chat.openai.com`, `perplexity.ai`, `claude.ai`,
   `copilot.microsoft.com`, `gemini.google.com`, `you.com`.
2. On a match it stores the source label in `sessionStorage` under
   `buyauto:ai-source` (`chatgpt`, `perplexity`, `claude`, `copilot`, `gemini`,
   `you`) — once per session, so reloads don't double-count.
3. It fires one gtag event: **`ai_referral`** with parameters `ai_source` and
   `page_referrer`.

Notes and limitations:

- The event goes through the shared `trackEvent()` helper, so it reaches **every
  configured gtag destination**. GA4 only records it when
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set in the Vercel environment (the repo itself
  carries no `G-` ID). The Google Ads tag (`AW-18317910859`, hardcoded default)
  ignores unknown event names — it neither breaks nor reports them. **If only the
  Ads tag is live, `ai_referral` is effectively invisible: create/verify the GA4
  property first** (see `GOOGLE_ANALYTICS_SETUP.md`).
- Consent Mode v2 applies. Before the visitor answers the cookie banner the event is
  sent cookieless; GA4 only models such traffic if behavioral modeling is active.
  Consented sessions are also attributed through the normal referrer on the released
  page view, so the AI channel group below works even where the custom event was
  modeled away.
- ChatGPT sometimes opens links with `Referrer-Policy` stripped or via the
  `utm_source=chatgpt.com` parameter instead of a referrer. The channel-group regex
  below catches the UTM case; a missing referrer is unmeasurable and lands in Direct.

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
- **Custom event**: Berichte → Interaktionen → Ereignisse → `ai_referral`. Register
  `ai_source` as a custom dimension (Verwaltung → Benutzerdefinierte Definitionen →
  Ereignisparameter `ai_source`) to split by assistant.
- **Explorativ**: dimension `ai_source`, metrics Sitzungen/Conversions, to see which
  assistant sends users who actually convert (`listing_published`,
  `submit_lead_form` Ads conversions).
