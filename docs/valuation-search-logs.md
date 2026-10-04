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
| `visitor_hash` | sha256(daily salt ‖ IP ‖ user agent). Groups one browser within a UTC day; the raw IP is never stored and the salt is replaced daily. |
| `is_internal` | admin account, or a browser with `localStorage.ba_no_track = "1"`, or a session that came from vercel.com |

Rows before 2026-10-04 were backfilled from the usage analysis: ids 2, 3, 4,
11, 13, 14, 15, 16 are the owner's tests (`is_internal`), 2/3/15/16 ran on
previews. Those rows have no user/visitor/source data.

**Keep your own browsers out:** on www.buyauto.ch, run
`localStorage.ba_no_track = "1"` in the console once per browser (same flag
GA4 uses). Admin accounts are flagged automatically; the test garage account
is not, so use the flag in the browser you test it with.

## Queries

Real usage only: `env = 'production' and not is_internal`.

```sql
-- People and searches per month
select date_trunc('month', created_at)::date as month,
       count(*) filter (where status = 'ok') as searches,
       count(distinct coalesce(user_id::text, visitor_id::text,
                               visitor_hash || created_at::date)) as people,
       count(*) filter (where status = 'gate_anon') as hit_anon_wall,
       count(distinct user_id) as logged_in_people
from valuation_search_logs
where env = 'production' and not is_internal
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

"People" counts a signed-in user once, a consenting browser once, and a
non-consenting browser once **per day**. It slightly over-counts people who
come back on another day without consent, and counts two people behind the
same IP and browser build on the same day as one.
