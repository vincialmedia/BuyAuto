import type { NextApiRequest, NextApiResponse } from "next";
import { authorizeCronRequest, runIndexNow, type IndexNowRunSummary } from "@/lib/buyauto/indexNow";
import { createIndexNowDataSource } from "@/services/indexNowService";

type IndexNowResponse = IndexNowRunSummary | { ok: false; error: string };

/**
 * Without CRON_SECRET the route accepts any request with the vercel-cron user agent,
 * which anyone can send. The cron runs once a day, so on that path an instance runs a
 * submitting (non-dry) call at most once per this interval; a repeat gets 429 before any
 * read. Per instance only, so it stops loops, not a determined caller: CRON_SECRET in
 * Vercel is the real gate.
 */
const UA_ONLY_MIN_INTERVAL_MS = 20 * 60 * 60 * 1000;
let lastUaOnlySubmissionAt: number | null = null;

/**
 * Daily IndexNow submission (Vercel Cron, see vercel.json): the listings that changed
 * in the last 26 hours, the hub and the brand pages of the brands concerned.
 *
 * Only production submits; any other environment (preview, local) and `?dryRun=1`
 * return the URL list without sending it, so a preview never reports production URLs.
 * IndexNow errors never fail the run: the JSON summary says what happened.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<IndexNowResponse>) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  const auth = authorizeCronRequest({
    authorization: req.headers.authorization,
    userAgent: req.headers["user-agent"],
    cronSecret,
  });
  if (!auth.ok) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }
  if (auth.warning) console.warn(auth.warning);

  const dryRun = process.env.VERCEL_ENV !== "production" || req.query.dryRun === "1";
  const uaOnly = !cronSecret?.trim();
  if (
    !dryRun &&
    uaOnly &&
    lastUaOnlySubmissionAt !== null &&
    Date.now() - lastUaOnlySubmissionAt < UA_ONLY_MIN_INTERVAL_MS
  ) {
    console.warn("IndexNow cron: repeated call without CRON_SECRET within the minimum interval; not submitted.");
    res.setHeader("Retry-After", String(Math.ceil((lastUaOnlySubmissionAt + UA_ONLY_MIN_INTERVAL_MS - Date.now()) / 1000)));
    res.status(429).json({ ok: false, error: "too_many_requests" });
    return;
  }
  // Taken before the run, so two concurrent calls cannot both submit.
  if (!dryRun && uaOnly) lastUaOnlySubmissionAt = Date.now();

  const summary = await runIndexNow({ source: createIndexNowDataSource(), fetchImpl: fetch, dryRun });

  if (!summary.ok) console.error("IndexNow run finished with errors:", { errors: summary.errors, submission: summary.submission });
  else console.log("IndexNow run:", { urls: summary.urlCount, dryRun: summary.dryRun, status: summary.submission?.status ?? null });

  res.status(200).json(summary);
}
