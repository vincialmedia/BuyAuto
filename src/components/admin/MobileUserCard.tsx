import { UserWithStats } from "@/services/userManagementService";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Calendar, FileText, MoreVertical, Trash2, KeyRound, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileUserCardProps {
  user: UserWithStats;
  onViewDetails: (user: UserWithStats) => void;
  onResetPassword: (user: UserWithStats) => void;
  onDelete: (user: UserWithStats) => void;
}

export function MobileUserCard({ 
  user, 
  onViewDetails, 
  onResetPassword, 
  onDelete 
}: MobileUserCardProps) {
  const formattedDate = new Date(user.created_at).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <Card className="p-4 space-y-3">
      {/* Header: Name + Actions */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 truncate">
            {user.full_name || 'Kein Name'}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant={user.role === 'admin' ? 'default' : 'secondary'}
              className={user.role === 'admin' ? 'bg-emerald-100 text-emerald-700' : ''}
            >
              {user.role === 'admin' ? (
                <><Shield className="w-3 h-3 mr-1" />Admin</>
              ) : (
                'User'
              )}
            </Badge>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onViewDetails(user)}>
              <FileText className="mr-2 h-4 w-4" />
              Details anzeigen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onResetPassword(user)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Passwort zurücksetzen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(user)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Konto löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Email */}
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <Mail className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{user.email}</span>
      </div>

      {/* Registration Date */}
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <Calendar className="w-4 h-4 flex-shrink-0" />
        <span>Registriert: {formattedDate}</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 pt-2 border-t border-neutral-200">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-neutral-500" />
          <span className="font-medium text-neutral-900">{user.listings_count}</span>
          <span className="text-neutral-600">Inserate</span>
        </div>
        {user.active_listings > 0 && (
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
            {user.active_listings} aktiv
          </Badge>
        )}
        {user.pending_listings > 0 && (
          <Badge variant="secondary" className="bg-amber-50 text-amber-700">
            {user.pending_listings} ausstehend
          </Badge>
        )}
      </div>
    </Card>
  );
}
