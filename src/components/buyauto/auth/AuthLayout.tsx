
import Head from "next/head";
import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function AuthLayout({ 
  children, 
  title = "Login & Registrierung | BuyAuto",
  description = "Melde dich bei BuyAuto an oder erstelle ein Konto, um deine Auto-Leasing-Inserate zu verwalten."
}: AuthLayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white">
        {/* Slim Header */}
        <header className="border-b border-neutral-200/60 bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center py-6">
              <Link 
                href="/" 
                className="transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                    <span className="text-white font-bold text-lg">BA</span>
                  </div>
                  <span className="text-2xl font-bold text-neutral-900 tracking-tight">
                    BuyAuto
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </main>

        {/* Subtle Footer */}
        <footer className="text-center py-8 text-neutral-500 text-sm">
          <p>© {new Date().getFullYear()} BuyAuto. Sicher und vertrauensvoll.</p>
        </footer>
      </div>
    </>
  );
}
