import type { NextApiRequest, NextApiResponse } from "next";
import { authorizeCronRequest, runIndexNow, type IndexNowRunSummary } from "@/lib/buyauto/indexNow";
import { createIndexNowDataSource } from "@/services/indexNowService";

type IndexNowResponse = IndexNowRunSummary | { ok: false; error: string };

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

  const auth = authorizeCronRequest({
    authorization: req.headers.authorization,
    userAgent: req.headers["user-agent"],
    cronSecret: process.env.CRON_SECRET,
  });
  if (!auth.ok) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }
  if (auth.warning) console.warn(auth.warning);

  const dryRun = process.env.VERCEL_ENV !== "production" || req.query.dryRun === "1";
  const summary = await runIndexNow({ source: createIndexNowDataSource(), fetchImpl: fetch, dryRun });

  if (!summary.ok) console.error("IndexNow run finished with errors:", { errors: summary.errors, submission: summary.submission });
  else console.log("IndexNow run:", { urls: summary.urlCount, dryRun: summary.dryRun, status: summary.submission?.status ?? null });

  res.status(200).json(summary);
}
