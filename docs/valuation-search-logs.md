# Eintauschwert-Rechner usage (`valuation_search_logs`)

Every automatic search and every blocked search writes one row, server-side
(`src/lib/buyauto/valuationLog.ts` → RPC `log_valuation_event`, service role
only). Manual comp entry and "Neuberechnung" never reach the server and are
not logged.

| Column | Meaning |
| --- | --- |
| `status` | `ok` search ran · `search_failed` Firecrawl key/credits · `gate_anon` anonymous 3-search wall · `gate_free` / `gate_paid` logged-in quota reached |
| `vehicle` | `{make, model, year, km, body, displacement}` as entered |
| `funnel` | search diagnostics (`picked`, `pickedComps`, drop counters); null for gate rows |
| `source` | `public` (/eintauschwert-rechner) · `dashboard` · `embed` (+ `embed_garage` slug) · `other` |
| `env` | `production` · `preview` · `development` · `local`. Preview builds write to the production database too. |
| `user_id` | signed-in user, else null |
| `visitor_id` | random per-browser id, only sent after analytics consent |
| `visitor_hash` | sha256(daily salt ‖ IP ‖ user agent). Groups one browser within a UTC day. The raw IP is never stored; pg_cron replaces the salt at 00:00 UTC (`valuation-visitor-salt-rotate`). |
| `is_internal` | admin account, or a browser with `localStorage.ba_no_track = "1"`, or a session that came from vercel.com |

Trust: rows are only written by our API routes (the RPC is service-role
only), but the page fields (`source`, `embed_garage`, `visitor_id`, the
internal flag) come from the browser, and so do `gate_anon` rows (the
anonymous counter lives in localStorage). Quota gates (`gate_free` /
`gate_paid`) are checked against the user's real quota. Gate rows are capped
at 10 per visitor hash and day.

Retention: pg_cron (`valuation-search-logs-pseudonymise`, daily) clears
`user_id`, `visitor_id` and `visitor_hash` on rows older than 12 months, as
promised in /datenschutz.

Rows before 2026-10-04 (ids 2–33) were labelled once from the usage analysis:
ids 2, 3, 4, 11, 13, 14, 15, 16 are the owner's tests (`is_internal`; 2, 3, 15
and 16 ran on PR previews, 4, 11, 13 and 14 were the test garage account), the
rest `env = 'production'`. Those rows have no user/visitor/source data. Rows
the old deploy wrote after the migration and before this code went live keep
`env` NULL until labelled by hand.

**Keep your own browsers out:** on www.buyauto.ch, run
`localStorage.ba_no_track = "1"` in the console once per browser (same flag
GA4 uses). Admin accounts are flagged automatically; the test garage account
is not, so use the flag in the browser you test it with.

## Queries

Real usage only: `env = 'production' and not is_internal`.

```sql
-- People and searches per month. An anonymous row is first resolved to the
-- account the same browser used later (same visitor_id, or same hash on the
-- same day), so someone who searches anonymously and then signs up counts once.
with real as (
  select * from valuation_search_logs
  where env = 'production' and not is_internal
), resolved as (
  select r.*,
         coalesce(r.user_id, (
           select s.user_id from real s
           where s.user_id is not null
             and ((r.visitor_id is not null and s.visitor_id = r.visitor_id)
               or (r.visitor_hash is not null and s.visitor_hash = r.visitor_hash
                   and s.created_at::date = r.created_at::date))
           order by s.created_at limit 1)) as person_user
  from real r
)
select date_trunc('month', created_at)::date as month,
       count(*) filter (where status = 'ok') as searches,
       count(distinct coalesce(person_user::text, visitor_id::text,
                               visitor_hash || created_at::date)) as people,
       count(*) filter (where status = 'gate_anon') as hit_anon_wall,
       count(distinct person_user) as logged_in_people
from resolved
group by 1 order by 1;

-- Which cars
select created_at at time zone 'Europe/Zurich' as zurich_time, status, source,
       vehicle->>'make' as make, vehicle->>'model' as model,
       vehicle->>'year' as year, vehicle->>'km' as km,
       funnel->>'picked' as comps_found
from valuation_search_logs
where env = 'production' and not is_internal
order by created_at desc;

-- Did anyone who hit the wall come back signed in? (needs visitor_id, i.e. consent)
select g.visitor_id, min(g.created_at) as hit_wall, min(s.created_at) as came_back_signed_in
from valuation_search_logs g
left join valuation_search_logs s
  on s.visitor_id = g.visitor_id and s.user_id is not null and s.created_at > g.created_at
where g.status = 'gate_anon' and g.env = 'production' and not g.is_internal
  and g.visitor_id is not null
group by 1;
```

"People" counts a signed-in user once (including their anonymous searches
from a browser they later signed in on), a consenting browser once, and a
non-consenting browser once **per day**. It over-counts people who come back
on another day without consent, and counts two people behind the same IP and
browser build on the same day as one. `visitor_id` only exists for consents
given to the banner text that names our own statistics (from 2026-10).
