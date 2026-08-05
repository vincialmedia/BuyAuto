import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { FileText, Users, ClipboardList, PencilRuler } from "lucide-react";

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
        {/* pt-24: the fixed sidebar starts at the viewport top, underneath the
            site header (sticky, h-20 at lg, z-50) — anything in the first 80px
            is permanently hidden behind it. */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-24 bg-white border-r border-neutral-200">
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
              icon={PencilRuler}
              label="Entwürfe"
              active={router.query.tab === 'drafts'}
              onClick={() => router.push('/admin?tab=drafts')}
            />
            <NavItem
              icon={Users}
              label="Benutzer"
              active={router.query.tab === 'users'}
              onClick={() => router.push('/admin?tab=users')}
            />
          </nav>
        </aside>

        {/* Main Content */}
        {/* min-w-0 lets the flex item shrink below its content width so wide
            tables scroll inside their overflow-x-auto wrapper instead of
            inflating the page (html/body clip horizontal overflow). */}
        <main className="flex-1 min-w-0 lg:pl-64">
          {/* Mobile Tabs — in flow inside <main>, not fixed to the viewport:
              fixed top-0 put the bar underneath the site header (sticky top-0
              z-50, h-16 md:h-20), which hid it entirely on mobile. The sticky
              offsets mirror those header heights so the bar pins right below
              it while scrolling. */}
          <div className="lg:hidden sticky top-16 md:top-20 z-30 bg-white border-b border-neutral-200">
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
                label="Entwürfe"
                active={router.query.tab === 'drafts'}
                onClick={() => router.push('/admin?tab=drafts')}
              />
              <MobileTab
                label="Benutzer"
                active={router.query.tab === 'users'}
                onClick={() => router.push('/admin?tab=users')}
              />
            </div>
          </div>
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
