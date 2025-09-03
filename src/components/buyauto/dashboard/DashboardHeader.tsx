
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { LogOut, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardHeader() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-white border-b border-neutral-200/60 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center group-hover:bg-red-600 transition-colors">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900 group-hover:text-red-500 transition-colors">
              BuyAuto
            </span>
          </Link>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden sm:flex items-center space-x-3">
                <span className="text-sm text-neutral-600">
                  {user.email}
                </span>
                <div className="w-px h-4 bg-neutral-300"></div>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-transparent hover:bg-red-50 border-neutral-300 hover:border-red-200 text-neutral-700 hover:text-red-600 transition-all"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? "Wird abgemeldet..." : "Abmelden"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
