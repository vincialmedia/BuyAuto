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
import { Search, Mail, FileText, MoreVertical, KeyRound, Trash2, Shield, ChevronLeft, ChevronRight, Building2, User as UserIcon, RefreshCw } from "lucide-react";
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
    search: "",
    role: "all",
    page: 1,
    limit: 25,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithStats | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<UserWithStats | null>(null);

  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState<UserWithStats | null>(null);
  const [targetRole, setTargetRole] = useState<"private" | "garage">("private");

  const [planChangeDialogOpen, setPlanChangeDialogOpen] = useState(false);
  const [userToChangePlan, setUserToChangePlan] = useState<UserWithStats | null>(null);
  const [targetPlan, setTargetPlan] = useState<"starter" | "growth" | "pro">("starter");

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.role]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userManagementService.getUsers(filters);
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Fehler beim Laden der Benutzer");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    await loadUsers();
  };

  const handleViewDetails = async (user: UserWithStats) => {
    try {
      const { listings } = await userManagementService.getUserDetails(user.id);
      setSelectedUser(user);
      setUserListings(listings);
      setUserDetailsOpen(true);
    } catch (error) {
      console.error("Error loading user details:", error);
      toast.error("Fehler beim Laden der Benutzerdetails");
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
      console.error("Error resetting password:", error);
      toast.error("Fehler beim Zurücksetzen des Passworts");
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
      console.error("Error deleting user:", error);
      toast.error("Fehler beim Löschen des Benutzers");
    }
  };

  const openRoleChange = (user: UserWithStats) => {
    setUserToChangeRole(user);
    setTargetRole(user.role === "garage" ? "private" : "garage");
    setRoleChangeDialogOpen(true);
  };

  const confirmRoleChange = async () => {
    if (!userToChangeRole) return;

    try {
      await userManagementService.setUserRole(userToChangeRole.id, targetRole);
      toast.success(`Rolle geändert: ${userToChangeRole.email} → ${targetRole === "garage" ? "Garage" : "Privat"}`);
      setRoleChangeDialogOpen(false);
      setUserToChangeRole(null);
      await loadUsers();
    } catch (error) {
      console.error("Error changing role:", error);
      toast.error("Fehler beim Ändern der Rolle");
    }
  };

  const openPlanChange = (user: UserWithStats) => {
    setUserToChangePlan(user);
    setTargetPlan("starter");
    setPlanChangeDialogOpen(true);
  };

  const confirmPlanChange = async () => {
    if (!userToChangePlan) return;

    try {
      await userManagementService.adminChangeGaragePlan(userToChangePlan.id, targetPlan);
      toast.success(`Garage-Plan geändert: ${userToChangePlan.email} → ${targetPlan}`);
      setPlanChangeDialogOpen(false);
      setUserToChangePlan(null);
      await loadUsers();
    } catch (error) {
      console.error("Error changing plan:", error);
      toast.error("Fehler beim Ändern des Garage-Plans");
    }
  };

  const approveGarageTrial = async () => {
    if (!userToChangePlan) return;

    try {
      const response = await fetch("/api/admin/approve-garage-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userToChangePlan.id, plan_code: targetPlan, duration_days: 30 }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to approve trial");
      }

      toast.success(`Trial aktiviert (30 Tage): ${userToChangePlan.email} → ${targetPlan}`);
      setPlanChangeDialogOpen(false);
      setUserToChangePlan(null);
      await loadUsers();
    } catch (error) {
      console.error("Error approving garage trial:", error);
      toast.error("Fehler beim Aktivieren des Trials");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const RoleBadge = ({ role }: { role: string | null }) => {
    if (role === "admin") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    }
    if (role === "garage") {
      return (
        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
          <Building2 className="w-3 h-3 mr-1" />
          Garage
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-neutral-100 text-neutral-700">
        <UserIcon className="w-3 h-3 mr-1" />
        Privat
      </Badge>
    );
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">Benutzer-Verwaltung</h2>
          <p className="text-sm text-neutral-600 mt-1">{total} insgesamt</p>
        </div>
        <Button variant="outline" onClick={loadUsers} className="w-full sm:w-auto">
          <RefreshCw className="w-4 h-4 mr-2" />
          Aktualisieren
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                placeholder="Suche nach Name oder E-Mail..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch}>Suchen</Button>
          </div>

          <Select value={filters.role} onValueChange={(value) => setFilters((prev) => ({ ...prev, role: value as any, page: 1 }))}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Rolle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Rollen</SelectItem>
              <SelectItem value="private">Privat</SelectItem>
              <SelectItem value="garage">Garage</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

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
                  <p className="font-medium text-neutral-900">{user.full_name || "Kein Name"}</p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </div>
                </TableCell>
                <TableCell>
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-neutral-600">{formatDate(user.created_at)}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium text-neutral-900">{user.listings_count}</span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Details anzeigen
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openRoleChange(user)} disabled={user.role === "admin"}>
                        <Building2 className="mr-2 h-4 w-4" />
                        {user.role === "garage" ? "Zu Privat wechseln" : "Zu Garage wechseln"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openPlanChange(user)} disabled={user.role !== "garage"}>
                        <Building2 className="mr-2 h-4 w-4" />
                        Garage-Plan ändern
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Passwort zurücksetzen
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(user)} className="text-red-600 focus:text-red-600">
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Seite {filters.page} von {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
              disabled={filters.page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Zurück
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
              disabled={filters.page === totalPages}
            >
              Weiter
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Benutzer löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Benutzer <strong>{userToDelete?.email}</strong> wirklich löschen?
              <br />
              <br />
              <strong className="text-red-600">Diese Aktion kann nicht rückgängig gemacht werden.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Ja, löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Passwort zurücksetzen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie eine Passwort-Reset-E-Mail an <strong>{userToResetPassword?.email}</strong> senden?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetPassword}>E-Mail senden</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={roleChangeDialogOpen} onOpenChange={setRoleChangeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rolle wechseln?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Benutzer <strong>{userToChangeRole?.email}</strong> wirklich zu{" "}
              <strong>{targetRole === "garage" ? "Garage" : "Privat"}</strong> wechseln?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Wechseln
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={planChangeDialogOpen} onOpenChange={setPlanChangeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Garage-Plan ändern?</AlertDialogTitle>
            <AlertDialogDescription>
              Wählen Sie den neuen Plan für <strong>{userToChangePlan?.email}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-4 space-y-3">
            <Select value={targetPlan} onValueChange={(v) => setTargetPlan(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Plan auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPlanChange}>
              Plan ändern
            </AlertDialogAction>
            <AlertDialogAction onClick={approveGarageTrial}>
              30 Tage Trial aktivieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
