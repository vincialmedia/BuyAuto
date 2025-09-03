
import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Car, 
  User,
  Plus,
  Menu,
  X
} from "lucide-react";
import DashboardHeader from "./DashboardHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentSection?: "overview" | "listings" | "account";
}

export default function DashboardLayout({ children, currentSection = "overview" }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const navigation = [
    {
      id: "overview",
      name: "Übersicht",
      icon: LayoutDashboard,
      href: "/dashboard"
    },
    {
      id: "listings", 
      name: "Meine Inserate",
      icon: Car,
      href: "/dashboard?section=listings"
    },
    {
      id: "account",
      name: "Konto",
      icon: User,
      href: "/dashboard?section=account"
    }
  ];

  const handleNavigation = (href: string, sectionId: string) => {
    if (sectionId === "overview") {
      router.push("/dashboard");
    } else {
      router.push(href);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 xl:col-span-2">
            <div className="sticky top-20 p-6">
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

              {/* CTA Button */}
              <div className="mt-8">
                <Button
                  onClick={() => router.push('/inserat-erstellen')}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm hover:shadow-md transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Neues Inserat
                </Button>
              </div>
            </div>
          </aside>

          {/* Mobile Navigation */}
          <div className="lg:hidden">
            <div className="bg-white border-b border-neutral-200/60 px-4 py-3">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-neutral-900">
                  {navigation.find(item => item.id === currentSection)?.name || "Dashboard"}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-neutral-600"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="bg-white border-b border-neutral-200/60 px-4 py-4 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;
                  
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start text-left h-auto py-3 px-4 font-medium",
                        isActive 
                          ? "bg-red-500 hover:bg-red-600 text-white" 
                          : "text-neutral-700 hover:bg-neutral-100"
                      )}
                      onClick={() => handleNavigation(item.href, item.id)}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Button>
                  );
                })}
                <Button
                  onClick={() => {
                    router.push('/inserat-erstellen');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Neues Inserat
                </Button>
              </div>
            )}
          </div>

          {/* Main Content */}
          <main className="lg:col-span-9 xl:col-span-10 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
