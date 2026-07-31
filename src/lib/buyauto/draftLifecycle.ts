/**
 * Draft lifecycle, mirrored from the database sweeps.
 *
 * A draft that goes 30 days without an edit is archived, and an archived draft
 * is deleted 5 days after that. The authoritative clock is
 * public.sweep_archive_stale_drafts / public.sweep_delete_archived_drafts,
 * which run hourly; these helpers only render the same countdown in the UI, so
 * the numbers here must stay in step with those functions.
 */

export const DRAFT_ARCHIVE_AFTER_DAYS = 30;
export const DRAFT_DELETE_AFTER_ARCHIVE_DAYS = 5;

/**
 * A listing declined by an admin gets the same 30-day limit a draft gets,
 * counted from the decline. Mirrors public.sweep_expire_declined_listings,
 * which stamps the real deadline (listings.draft_delete_at) in the final 5 days
 * — both name the same date, so the countdown runs 30 -> 0 without a jump.
 */
export const DECLINE_DELETE_AFTER_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface DraftLifecycleInput {
  updated_at: string;
  archived_at?: string | null;
  /**
   * The sweep's actual deletion deadline (listings.draft_delete_at). When
   * present it is authoritative — deriving archived_at + 5 days drifts from
   * the real clock for drafts that were revived and re-archived, and a revived
   * draft has a running deadline with no archived_at at all.
   */
  draft_delete_at?: string | null;
}

export interface DraftLifecycle {
  archived: boolean;
  /** When the draft is (or was) archived. */
  archiveDueAt: Date;
  /** When the draft gets deleted — only known once it has been archived. */
  deleteDueAt: Date | null;
  /** Whole days until archiving; 0 once due. Null when already archived. */
  daysUntilArchive: number | null;
  /** Whole days until deletion; 0 once due. Null while still active. */
  daysUntilDelete: number | null;
}

const addDays = (iso: string, days: number) => new Date(Date.parse(iso) + days * MS_PER_DAY);

const wholeDaysFromNow = (target: Date, now: Date) =>
  Math.max(0, Math.ceil((target.getTime() - now.getTime()) / MS_PER_DAY));

export function getDraftLifecycle(draft: DraftLifecycleInput, now: Date = new Date()): DraftLifecycle {
  const archivedAt = draft.archived_at ?? null;
  const deleteAt = draft.draft_delete_at ?? null;

  if (archivedAt || deleteAt) {
    const deleteDueAt = deleteAt
      ? new Date(Date.parse(deleteAt))
      : addDays(archivedAt as string, DRAFT_DELETE_AFTER_ARCHIVE_DAYS);
    const archiveDueAt = archivedAt
      ? new Date(Date.parse(archivedAt))
      : new Date(deleteDueAt.getTime() - DRAFT_DELETE_AFTER_ARCHIVE_DAYS * MS_PER_DAY);
    return {
      archived: true,
      archiveDueAt,
      deleteDueAt,
      daysUntilArchive: null,
      daysUntilDelete: wholeDaysFromNow(deleteDueAt, now),
    };
  }

  const archiveDueAt = addDays(draft.updated_at, DRAFT_ARCHIVE_AFTER_DAYS);
  return {
    archived: false,
    archiveDueAt,
    deleteDueAt: null,
    daysUntilArchive: wholeDaysFromNow(archiveDueAt, now),
    daysUntilDelete: null,
  };
}

/** German label for the dashboard and admin table. */
export function describeDraftLifecycle(lifecycle: DraftLifecycle): string {
  if (lifecycle.archived) {
    const days = lifecycle.daysUntilDelete ?? 0;
    if (days <= 0) return "Wird in Kürze gelöscht";
    return `Wird in ${days} ${days === 1 ? "Tag" : "Tagen"} gelöscht`;
  }

  const days = lifecycle.daysUntilArchive ?? 0;
  if (days <= 0) return "Wird in Kürze archiviert";
  return `Wird in ${days} ${days === 1 ? "Tag" : "Tagen"} archiviert`;
}

export function formatDateDeCh(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}
