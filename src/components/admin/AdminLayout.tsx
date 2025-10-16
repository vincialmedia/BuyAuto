import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { FileText, Users, ClipboardList } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar + Main Content */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-4 bg-white border-r border-neutral-200">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Admin Panel</h2>
          </div>
          <nav className="flex-1 px-4 py-2 space-y-2">
            <NavItem
              icon={ClipboardList}
              label="Moderation"
              active={router.pathname === '/admin' && !router.query.tab}
              onClick={() => router.push('/admin')}
            />
            <NavItem
              icon={FileText}
              label="Inserate"
              active={router.query.tab === 'listings'}
              onClick={() => router.push('/admin?tab=listings')}
            />
            <NavItem
              icon={Users}
              label="Benutzer"
              active={router.query.tab === 'users'}
              onClick={() => router.push('/admin?tab=users')}
            />
          </nav>
        </aside>

        {/* Mobile Tabs */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-10 bg-white border-b border-neutral-200">
          <div className="flex overflow-x-auto">
            <MobileTab
              label="Moderation"
              active={router.pathname === '/admin' && !router.query.tab}
              onClick={() => router.push('/admin')}
            />
            <MobileTab
              label="Inserate"
              active={router.query.tab === 'listings'}
              onClick={() => router.push('/admin?tab=listings')}
            />
            <MobileTab
              label="Benutzer"
              active={router.query.tab === 'users'}
              onClick={() => router.push('/admin?tab=users')}
            />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:pl-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-8">
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
        flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors border-b-2
        ${active 
          ? 'border-emerald-500 text-emerald-700 bg-emerald-50' 
          : disabled 
            ? 'border-transparent text-neutral-400 cursor-not-allowed'
            : 'border-transparent text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
        }
      `}
    >
      {label}
      {disabled && <span className="text-xs ml-1">(Soon)</span>}
    </button>
  );
}
