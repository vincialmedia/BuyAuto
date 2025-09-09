import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, FileText, Users } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="w-6 h-6 text-emerald-600" />
              <h1 className="text-xl font-semibold text-neutral-900">
                Admin Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-neutral-600">
                {user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Abmelden</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar + Main Content */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 bg-white border-r border-neutral-200">
          <nav className="flex-1 px-4 py-6 space-y-2">
            <NavItem
              icon={FileText}
              label="Moderation"
              active={router.pathname === '/admin' || !router.query.tab}
              onClick={() => router.push('/admin')}
            />
            <NavItem
              icon={FileText}
              label="Alle Inserate"
              active={router.query.tab === 'listings'}
              onClick={() => router.push('/admin?tab=listings')}
            />
            <NavItem
              icon={Users}
              label="Anfragen"
              active={router.query.tab === 'inquiries'}
              onClick={() => router.push('/admin?tab=inquiries')}
              disabled
            />
          </nav>
        </aside>

        {/* Mobile Tabs */}
        <div className="lg:hidden bg-white border-b border-neutral-200 px-4 py-2">
          <div className="flex space-x-1">
            <MobileTab
              label="Moderation"
              active={router.pathname === '/admin' || !router.query.tab}
              onClick={() => router.push('/admin')}
            />
            <MobileTab
              label="Alle Inserate"
              active={router.query.tab === 'listings'}
              onClick={() => router.push('/admin?tab=listings')}
            />
            <MobileTab
              label="Anfragen"
              active={router.query.tab === 'inquiries'}
              onClick={() => router.push('/admin?tab=inquiries')}
              disabled
            />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:pl-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: React.ComponentType<any>;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function NavItem({ icon: Icon, label, active, disabled, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
        ${active 
          ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500' 
          : disabled 
            ? 'text-neutral-400 cursor-not-allowed'
            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
        }
      `}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
      {disabled && <span className="text-xs">(Soon)</span>}
    </button>
  );
}

interface MobileTabProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function MobileTab({ label, active, disabled, onClick }: MobileTabProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-md text-sm font-medium transition-colors
        ${active 
          ? 'bg-emerald-100 text-emerald-700' 
          : disabled 
            ? 'text-neutral-400 cursor-not-allowed'
            : 'text-neutral-600 hover:bg-neutral-100'
        }
      `}
    >
      {label}
      {disabled && <span className="text-xs ml-1">(Soon)</span>}
    </button>
  );
}