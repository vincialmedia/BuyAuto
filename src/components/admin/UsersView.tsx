import { useState, useEffect } from "react";
import { userManagementService, UserWithStats, UserFilters } from "@/services/userManagementService";
import { MobileUserCard } from "@/components/admin/MobileUserCard";
import { UserDetailsModal } from "@/components/admin/UserDetailsModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Users, Mail, Calendar, FileText, MoreVertical, KeyRound, Trash2, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function UsersView() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    page: 1,
    limit: 25
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithStats | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<UserWithStats | null>(null);

  useEffect(() => {
    loadUsers();
  }, [filters.page, filters.role]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userManagementService.getUsers(filters);
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    loadUsers();
  };

  const handleViewDetails = async (user: UserWithStats) => {
    try {
      const { listings } = await userManagementService.getUserDetails(user.id);
      setSelectedUser(user);
      setUserListings(listings);
      setUserDetailsOpen(true);
    } catch (error) {
      console.error('Error loading user details:', error);
      toast.error('Fehler beim Laden der Benutzerdetails');
    }
  };

  const handleResetPassword = (user: UserWithStats) => {
    setUserToResetPassword(user);
    setResetPasswordDialogOpen(true);
  };

  const confirmResetPassword = async () => {
    if (!userToResetPassword) return;

    try {
      await userManagementService.resetUserPassword(userToResetPassword.email);
      toast.success(`Passwort-Reset-E-Mail wurde an ${userToResetPassword.email} gesendet`);
      setResetPasswordDialogOpen(false);
      setUserToResetPassword(null);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Fehler beim Zurücksetzen des Passworts');
    }
  };

  const handleDelete = (user: UserWithStats) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await userManagementService.deleteUser(userToDelete.id);
      toast.success(`Benutzer ${userToDelete.email} wurde gelöscht`);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      setUserDetailsOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Fehler beim Löschen des Benutzers');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-neutral-200 animate-pulse rounded"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-neutral-100 animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">Benutzer-Verwaltung</h2>
          <p className="text-sm text-neutral-600 mt-1">
            {total} {total === 1 ? 'Benutzer' : 'Benutzer'} insgesamt
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                placeholder="Suche nach Name oder E-Mail..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch}>
              Suchen
            </Button>
          </div>

          {/* Role Filter */}
          <Select
            value={filters.role}
            onValueChange={(value) => setFilters(prev => ({ ...prev, role: value as any, page: 1 }))}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Rolle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Rollen</SelectItem>
              <SelectItem value="user">Benutzer</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Desktop Table */}
      <Card className="hidden md:block overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Benutzer</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>Registriert</TableHead>
              <TableHead className="text-center">Inserate</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-neutral-50">
                <TableCell>
                  <div>
                    <p className="font-medium text-neutral-900">
                      {user.full_name || 'Kein Name'}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </div>
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
                  <span className="text-sm text-neutral-600">
                    {formatDate(user.created_at)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-medium text-neutral-900">{user.listings_count}</span>
                    {user.active_listings > 0 && (
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                        {user.active_listings} aktiv
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Details anzeigen
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Passwort zurücksetzen
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(user)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Konto löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {users.map((user) => (
          <MobileUserCard
            key={user.id}
            user={user}
            onViewDetails={handleViewDetails}
            onResetPassword={handleResetPassword}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Seite {filters.page} von {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page! - 1 }))}
              disabled={filters.page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Zurück
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
              disabled={filters.page === totalPages}
            >
              Weiter
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={userDetailsOpen}
        onClose={() => setUserDetailsOpen(false)}
        user={selectedUser}
        listings={userListings}
        onResetPassword={() => {
          if (selectedUser) {
            setUserDetailsOpen(false);
            handleResetPassword(selectedUser);
          }
        }}
        onDelete={() => {
          if (selectedUser) {
            setUserDetailsOpen(false);
            handleDelete(selectedUser);
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Benutzer löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Benutzer <strong>{userToDelete?.email}</strong> wirklich löschen?
              <br /><br />
              <strong className="text-red-600">Diese Aktion kann nicht rückgängig gemacht werden.</strong>
              <br /><br />
              Folgendes wird gelöscht:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Benutzerprofil und Authentifizierung</li>
                <li>Alle Inserate des Benutzers ({userToDelete?.listings_count})</li>
                <li>Alle zugehörigen Daten</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Ja, löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Confirmation Dialog */}
      <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Passwort zurücksetzen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie eine Passwort-Reset-E-Mail an <strong>{userToResetPassword?.email}</strong> senden?
              <br /><br />
              Der Benutzer erhält eine E-Mail mit einem Link zum Zurücksetzen des Passworts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetPassword}>
              E-Mail senden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
