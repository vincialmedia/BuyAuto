import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Car,
  User
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentSection?: "overview" | "listings" | "account";
  leftRail?: React.ReactNode;
  hideSidebar?: boolean;
}

// Mount-gate for desktop-only content: false on SSR/first render, then tracks
// the lg breakpoint via matchMedia so mobile never mounts (or fetches for) it.
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

export default function DashboardLayout({ children, currentSection = "overview", leftRail, hideSidebar = false }: DashboardLayoutProps) {
  const isDesktop = useIsDesktop();
  const router = useRouter();

  // Only the overview entry is real: no dashboard page ever read the old
  // ?section= params, so the parameterized links were silent no-ops.
  const navigation = [
    {
      id: "overview",
      name: "Übersicht",
      icon: LayoutDashboard,
      href: "/dashboard"
    }
  ];

  const handleNavigation = (href: string, sectionId: string) => {
    if (sectionId === "overview") {
      router.push("/dashboard");
    } else {
      router.push(href);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="max-w-7xl mx-auto">
        <div className={cn("lg:grid lg:gap-8", hideSidebar ? "lg:grid-cols-12" : "lg:grid-cols-12 lg:gap-8")}>
          {/* Desktop Left Rail / Sidebar */}
          <aside className={cn("hidden lg:block", hideSidebar ? "lg:col-span-3 xl:col-span-3" : "lg:col-span-3 xl:col-span-2")}>
            <div className="sticky top-20 p-6">
              {hideSidebar ? (
                isDesktop && leftRail ? <>{leftRail}</> : null
              ) : (
                <>
                  <nav className="space-y-2">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentSection === item.id;
                      
                      return (
                        <Button
                          key={item.id}
                          variant={isActive ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start text-left h-auto py-3 px-4 font-medium transition-all",
                            isActive 
                              ? "bg-red-500 hover:bg-red-600 text-white shadow-sm" 
                              : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                          )}
                          onClick={() => handleNavigation(item.href, item.id)}
                        >
                          <Icon className="w-5 h-5 mr-3" />
                          {item.name}
                        </Button>
                      );
                    })}
                  </nav>
                </>
              )}
            </div>
          </aside>

          {/*
            No mobile section bar here: it duplicated the site header's hamburger
            one row below it, and its links (Übersicht / Meine Inserate / Konto)
            pointed at ?section= params the dashboard pages don't read — every
            entry landed back on the same single-page dashboard. The site header
            is the only nav on mobile now.
          */}

          {/* Main Content */}
          <main className={cn("p-4 lg:p-6", hideSidebar ? "lg:col-span-9 xl:col-span-9" : "lg:col-span-9 xl:col-span-10")}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}