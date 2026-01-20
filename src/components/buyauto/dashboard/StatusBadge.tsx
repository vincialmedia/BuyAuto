import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface StatusBadgeProps {
  status: "draft" | "pending" | "active" | "inactive" | "sold" | "published" | "rejected" | "expired";
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
      case "sold":
        return { text: "Verkauft", variant: "sold" as const };
      case "published":
        return { text: "Veröffentlicht", variant: "published" as const };
      case "rejected":
        return { text: "Abgelehnt", variant: "rejected" as const };
      case "expired":
        return { text: "Abgelaufen", variant: "expired" as const };
      default:
        return { text: "Unbekannt", variant: "pending" as const };
    }
  };

  const { text, variant } = getStatusDisplay();

  const variants = {
    draft: "bg-neutral-100 text-neutral-800 border-neutral-200/60",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-neutral-100 text-neutral-600 border-neutral-200",
    sold: "bg-blue-50 text-blue-700 border-blue-200",
    published: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-600 border-red-200",
    expired: "bg-neutral-100 text-neutral-800 border-neutral-200/60",
  };

  const label =
    status === "draft"
      ? "Entwurf"
      : status === "pending"
        ? "In Prüfung"
        : status === "published"
          ? "Online"
          : status === "rejected"
            ? "Abgelehnt"
            : status === "expired"
              ? "Abgelaufen"
              : status === "sold"
                ? "Verkauft"
                : status === "inactive"
                  ? "Inaktiv"
                  : status === "active"
                    ? "Aktiv"
                    : "Unbekannt";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
        variants[variant],
        className
      )}
    >
      {text}
    </span>
  );
}
