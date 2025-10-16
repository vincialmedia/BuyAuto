import { UserProfile } from "@/services/userManagementService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Calendar, FileText, Shield, KeyRound, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  listings: any[];
  onResetPassword: () => void;
  onDelete: () => void;
}

export function UserDetailsModal({
  isOpen,
  onClose,
  user,
  listings,
  onResetPassword,
  onDelete
}: UserDetailsModalProps) {
  if (!user) return null;

  const formattedDate = new Date(user.created_at).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Benutzerdetails</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Card */}
          <Card className="p-6">
            <div className="space-y-4">
              {/* Name & Role */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {user.full_name || 'Kein Name'}
                  </h3>
                  <div className="mt-2">
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
              </div>

              {/* Email */}
              <div className="flex items-center gap-3 text-neutral-700">
                <Mail className="w-5 h-5 text-neutral-500" />
                <span>{user.email}</span>
              </div>

              {/* Registration Date */}
              <div className="flex items-center gap-3 text-neutral-700">
                <Calendar className="w-5 h-5 text-neutral-500" />
                <span>Registriert: {formattedDate}</span>
              </div>

              {/* User ID */}
              <div className="pt-2 border-t border-neutral-200">
                <p className="text-sm text-neutral-500">User ID</p>
                <p className="text-sm font-mono text-neutral-700 break-all">{user.id}</p>
              </div>
            </div>
          </Card>

          {/* Listings Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-neutral-700" />
              <h3 className="text-lg font-semibold text-neutral-900">
                Inserate ({listings.length})
              </h3>
            </div>

            {listings.length === 0 ? (
              <Card className="p-6">
                <p className="text-center text-neutral-500">Keine Inserate vorhanden</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {listings.map((listing) => (
                  <Card key={listing.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-neutral-900 truncate">
                          {listing.brand} {listing.model}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="secondary"
                            className={
                              listing.status === 'published' 
                                ? 'bg-emerald-50 text-emerald-700'
                                : listing.status === 'pending'
                                ? 'bg-amber-50 text-amber-700'
                                : listing.status === 'rejected'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-neutral-100 text-neutral-700'
                            }
                          >
                            {listing.status === 'published' && 'Freigegeben'}
                            {listing.status === 'pending' && 'Ausstehend'}
                            {listing.status === 'rejected' && 'Abgelehnt'}
                            {listing.status === 'expired' && 'Abgelaufen'}
                          </Badge>
                          <span className="text-sm text-neutral-500">
                            {new Date(listing.created_at).toLocaleDateString('de-CH')}
                          </span>
                        </div>
                      </div>
                      {listing.price_paid_chf && (
                        <div className="text-right ml-4">
                          <p className="text-sm font-medium text-neutral-900">
                            CHF {listing.price_paid_chf}
                          </p>
                          <p className="text-xs text-neutral-500">pro Monat</p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-200">
            <Button
              onClick={onResetPassword}
              variant="outline"
              className="flex-1"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Passwort zurücksetzen
            </Button>
            <Button
              onClick={onDelete}
              variant="destructive"
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Konto löschen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
