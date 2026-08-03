import { useEffect, useRef, useState } from "react";
import Router from "next/router";
import { Loader2 } from "lucide-react";

// Global navigation feedback. Every page here fetches its data in
// getServerSideProps, so a click on a listing card commits nothing to the
// screen until the server round trip finishes — without this bar the app
// looks frozen for the whole wait, on desktop and mobile alike.

// Navigations that finish faster than this never show the bar, so
// CDN-cached pages don't flash a progress flicker on every click.
const SHOW_DELAY_MS = 150;
const TRICKLE_INTERVAL_MS = 350;
const HIDE_AFTER_DONE_MS = 400;

interface BarState {
  visible: boolean;
  progress: number;
}

export default function RouteProgress() {
  const [bar, setBar] = useState<BarState>({ visible: false, progress: 0 });
  const shownRef = useRef(false);
  const timersRef = useRef<{
    show?: ReturnType<typeof setTimeout>;
    trickle?: ReturnType<typeof setInterval>;
    hide?: ReturnType<typeof setTimeout>;
  }>({});

  useEffect(() => {
    const clearTimers = () => {
      const t = timersRef.current;
      if (t.show) clearTimeout(t.show);
      if (t.trickle) clearInterval(t.trickle);
      if (t.hide) clearTimeout(t.hide);
      timersRef.current = {};
    };

    const start = (_url: string, opts?: { shallow?: boolean }) => {
      // Shallow transitions swap the URL without fetching anything.
      if (opts?.shallow) return;
      clearTimers();
      timersRef.current.show = setTimeout(() => {
        shownRef.current = true;
        setBar({ visible: true, progress: 10 });
        // Asymptotic trickle towards 90% — the jump to 100% happens on
        // routeChangeComplete, however long the server takes.
        timersRef.current.trickle = setInterval(() => {
          setBar((prev) => ({
            ...prev,
            progress: Math.min(90, prev.progress + Math.max(0.5, (90 - prev.progress) * 0.12)),
          }));
        }, TRICKLE_INTERVAL_MS);
      }, SHOW_DELAY_MS);
    };

    const stop = () => {
      clearTimers();
      if (!shownRef.current) return;
      shownRef.current = false;
      setBar({ visible: true, progress: 100 });
      timersRef.current.hide = setTimeout(() => {
        setBar({ visible: false, progress: 0 });
      }, HIDE_AFTER_DONE_MS);
    };

    Router.events.on("routeChangeStart", start);
    Router.events.on("routeChangeComplete", stop);
    Router.events.on("routeChangeError", stop);

    return () => {
      Router.events.off("routeChangeStart", start);
      Router.events.off("routeChangeComplete", stop);
      Router.events.off("routeChangeError", stop);
      clearTimers();
    };
  }, []);

  if (!bar.visible) return null;

  const done = bar.progress >= 100;

  return (
    <>
      {/* Above the sticky header (z-50). */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-1" aria-hidden>
        <div
          className="h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] transition-[width,opacity] duration-300 ease-out"
          style={{ width: `${bar.progress}%`, opacity: done ? 0 : 1 }}
        />
      </div>

      {/* The thin bar alone is easy to miss under mobile browser chrome, so
          pair it with an explicit spinner pill. */}
      <div
        className={`pointer-events-none fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 transition-opacity duration-300 ${
          done ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/95 px-4 py-2 shadow-lg shadow-neutral-900/10 backdrop-blur-sm">
          <Loader2 className="h-4 w-4 animate-spin text-red-500" />
          <span className="text-sm font-medium text-neutral-700">Wird geladen…</span>
        </div>
      </div>
    </>
  );
}
