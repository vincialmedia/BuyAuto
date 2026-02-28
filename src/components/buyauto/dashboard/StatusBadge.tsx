import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status:
    | "draft"
    | "pending"
    | "active"
    | "inactive"
    | "sold"
    | "published"
    | "rejected"
    | "expired"
    | "archived"
    | "paused";
  expiresAt?: string | null;
  className?: string;
}

export default function StatusBadge({ status, expiresAt, className }: StatusBadgeProps) {
  const getStatusDisplay = () => {
    if (status === "published" && expiresAt) {
      const now = new Date();
      const expiry = new Date(expiresAt);
      if (expiry <= now) {
        return { text: "Abgelaufen", variant: "expired" as const };
      }
    }

    switch (status) {
      case "draft":
        return { text: "Entwurf", variant: "draft" as const };
      case "pending":
        return { text: "Ausstehend", variant: "pending" as const };
      case "active":
        return { text: "Aktiv", variant: "active" as const };
      case "inactive":
        return { text: "Inaktiv", variant: "inactive" as const };
      case "paused":
        return { text: "Pausiert", variant: "paused" as const };
      case "sold":
        return { text: "Verkauft", variant: "sold" as const };
      case "published":
        return { text: "Veröffentlicht", variant: "published" as const };
      case "rejected":
        return { text: "Abgelehnt", variant: "rejected" as const };
      case "archived":
        return { text: "Archiviert", variant: "archived" as const };
      case "expired":
        return { text: "Abgelaufen", variant: "expired" as const };
      default:
        return { text: "Unbekannt", variant: "pending" as const };
    }
  };

  const { text, variant } = getStatusDisplay();

  const variants: Record<
    string,
    { container: string; dot?: string }
  > = {
    draft: { container: "bg-neutral-100 text-neutral-800 border-neutral-200/60" },
    pending: { container: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    active: { container: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    inactive: { container: "bg-neutral-100 text-neutral-600 border-neutral-200" },
    paused: { container: "bg-amber-50 text-amber-700 border-amber-200" },
    sold: { container: "bg-blue-50 text-blue-700 border-blue-200" },
    published: { container: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected: { container: "bg-red-50 text-red-600 border-red-200" },
    expired: { container: "bg-neutral-100 text-neutral-800 border-neutral-200/60" },
    archived: { container: "bg-neutral-100 text-neutral-800 border-neutral-200/60" },
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
        variants[variant]?.container ?? variants.pending.container,
        className
      )}
    >
      {text}
    </span>
  );
}