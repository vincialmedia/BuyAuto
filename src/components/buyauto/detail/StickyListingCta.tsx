import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function StickyListingCta({
  onInquiry,
  onOpenChat,
  sentinelId,
}: {
  onInquiry: () => void;
  onOpenChat: () => void;
  sentinelId: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById(sentinelId);
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setVisible(!entry.isIntersecting);
      },
      { root: null, threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [sentinelId]);

  return (
    <div
      className={[
        "fixed inset-x-0 bottom-0 z-50",
        "transition-transform duration-300",
        visible ? "translate-y-0" : "translate-y-full",
      ].join(" ")}
    >
      <div className="bg-white/80 backdrop-blur-md border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <Button
              onClick={onInquiry}
              className="flex-1 rounded-2xl bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Jetzt anfragen
            </Button>
            <Button
              onClick={onOpenChat}
              variant="outline"
              className="rounded-2xl border-neutral-200 bg-white/60 hover:bg-white"
              size="lg"
            >
              Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}