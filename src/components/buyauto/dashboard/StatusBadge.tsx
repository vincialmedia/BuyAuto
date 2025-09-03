
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pending" | "published" | "expired";
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
      case "pending":
        return { text: "Ausstehend", variant: "pending" as const };
      case "published":
        return { text: "Veröffentlicht", variant: "published" as const };
      case "expired":
        return { text: "Abgelaufen", variant: "expired" as const };
      default:
        return { text: "Unbekannt", variant: "pending" as const };
    }
  };

  const { text, variant } = getStatusDisplay();

  const variants = {
    pending: "bg-neutral-100 text-neutral-600 border-neutral-200",
    published: "bg-emerald-50 text-emerald-700 border-emerald-200",
    expired: "bg-red-50 text-red-600 border-red-200"
  };

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
