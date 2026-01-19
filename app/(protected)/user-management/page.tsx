"use client";

import { useEffect, useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { database } from "@/lib/firebase";
import { onValue, ref, update } from "firebase/database";
import { APP_ROLES, DEFAULT_APP_ROLE, ROLE_LANDING_PAGES, SUBSYSTEM_PLACEHOLDERS } from "@/lib/constants";
import { UserProfile } from "@/types/auth";
import { useToast } from "@/hooks/useToast";

type ManagedUser = UserProfile & { id: string };

const ROLE_OPTIONS = [
  { label: "Hotel Manager", value: APP_ROLES.HOTEL_MANAGER },
  { label: "Finance Manager", value: APP_ROLES.FINANCE_MANAGER },
  { label: "Operations Manager", value: APP_ROLES.OPERATIONS_MANAGER },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingEdits, setPendingEdits] = useState<Record<string, { role: string; landingPage: string }>>({});
  const { toast } = useToast();

  useEffect(() => {
    const usersRef = ref(database, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const value = snapshot.val() || {};
      const records: ManagedUser[] = Object.entries(value).map(([id, data]) => {
        const record = data as Partial<UserProfile>;
        const role = record.role ?? DEFAULT_APP_ROLE;
        const landingPage = record.landingPage ?? ROLE_LANDING_PAGES[role] ?? ROLE_LANDING_PAGES[DEFAULT_APP_ROLE];
        return {
          id,
          email: record.email ?? "",
          fullName: record.fullName ?? "",
          role,
          landingPage,
          createdAt: record.createdAt,
        };
      });
      setUsers(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const landingPageOptions = useMemo(() => {
    // Merge placeholders with role defaults so everything stays selectable
    const defaults = Object.values(ROLE_LANDING_PAGES).map((route) => ({ value: route, label: `${route} (default)` }));
    const combined = [...SUBSYSTEM_PLACEHOLDERS, ...defaults];
    const seen = new Set<string>();
    return combined.filter(({ value }) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }, []);

  const handleChange = (id: string, field: "role" | "landingPage", value: string) => {
    setPendingEdits((prev) => ({
      ...prev,
      [id]: {
        role: prev[id]?.role ?? users.find((u) => u.id === id)?.role ?? DEFAULT_APP_ROLE,
        landingPage: prev[id]?.landingPage ?? users.find((u) => u.id === id)?.landingPage ?? ROLE_LANDING_PAGES[DEFAULT_APP_ROLE],
        [field]: value,
      },
    }));
  };

  const handleSave = async (userId: string) => {
    const edits = pendingEdits[userId];
    const nextRole = edits?.role ?? users.find((u) => u.id === userId)?.role ?? DEFAULT_APP_ROLE;
    const nextLandingPage = edits?.landingPage ?? ROLE_LANDING_PAGES[nextRole] ?? ROLE_LANDING_PAGES[DEFAULT_APP_ROLE];

    setSavingId(userId);
    try {
      await update(ref(database, `users/${userId}`), {
        role: nextRole,
        landingPage: nextLandingPage,
      });
      toast({ title: "User updated", description: "Access settings saved." });
      setPendingEdits((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Update failed", description: (error as Error).message });
    } finally {
      setSavingId(null);
    }
  };

  const hasPendingChanges = (userId: string) => Boolean(pendingEdits[userId]);

  return (
    <PageContainer
      title="User Management"
      subtitle="Manage roles, landing pages, and shared authentication across subsystems."
    >
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg">Access control</CardTitle>
            <CardDescription>
              All subsystems share this login. Map each user to their landing page (e.g., inventory, reception).
              Routes are placeholders until the actual subsystem URLs are ready.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <RefreshCw className="h-4 w-4" />
            <span>Realtime sync with Firebase</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
              No users found. New sign-ups will appear here automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Landing page</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const pending = pendingEdits[u.id];
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-black">{u.fullName || "—"}</span>
                            <span className="text-xs text-gray-500">Created {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">{u.email}</TableCell>
                        <TableCell>
                          <Select
                            value={pending?.role ?? u.role}
                            onValueChange={(val) => handleChange(u.id, "role", val)}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={pending?.landingPage ?? u.landingPage}
                            onValueChange={(val) => handleChange(u.id, "landingPage", val)}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {landingPageOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="mt-1">
                            <Badge variant="secondary">{pending?.landingPage ?? u.landingPage}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            disabled={savingId === u.id || !hasPendingChanges(u.id)}
                            onClick={() => handleSave(u.id)}
                          >
                            {savingId === u.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
