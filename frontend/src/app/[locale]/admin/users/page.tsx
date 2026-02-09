"use client";

import { useEffect, useState } from "react";
import { IconUser, IconShield, IconShieldCheck } from "@/components/icons";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/elements/button";
import { Badge } from "@/components/elements/badge";
import { Card, CardContent } from "@/components/elements/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/elements/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/elements/dialog";
import { Skeleton } from "@/components/elements/skeleton";
import { Container } from "@/components/elements/container";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { DataTable } from "@/components/admin/data-table";
import {
  getAdminUsers,
  updateUserRole,
  activateUser,
  deactivateUser,
  downloadCsv,
  type AdminUser,
  type AdminUserList,
} from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const ROLES = [
  { value: "all", label: "All Roles" },
  { value: "customer", label: "Customer" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const ROLE_OPTIONS = [
  { value: "customer", label: "Customer", icon: IconUser },
  { value: "admin", label: "Admin", icon: IconShield },
  { value: "super_admin", label: "Super Admin", icon: IconShieldCheck },
];

export default function AdminUsersPage() {
  const t = useTranslations("admin");
  const { token, user: currentUser } = useAuthStore();
  const [userData, setUserData] = useState<AdminUserList | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  // Role change dialog
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState("");
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = (currentUser as unknown as { role?: string })?.role === "super_admin";

  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await getAdminUsers(token, {
          role: roleFilter === "all" ? undefined : roleFilter,
          limit,
          offset: page * limit,
        });
        setUserData(data);
      } catch {
        toast.error(t("failedLoadUsers"));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token, roleFilter, page, t]);

  const handleRoleChange = async () => {
    if (!token || !editingUser) return;

    setSaving(true);
    try {
      await updateUserRole(editingUser.id, newRole, token);
      toast.success(t("userRoleUpdated"));
      setEditingUser(null);

      // Refresh list
      const data = await getAdminUsers(token, {
        role: roleFilter === "all" ? undefined : roleFilter,
        limit,
        offset: page * limit,
      });
      setUserData(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedUpdateRole"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    if (!token) return;

    try {
      if (user.is_active) {
        await deactivateUser(user.id, token);
        toast.success(t("userDeactivated"));
      } else {
        await activateUser(user.id, token);
        toast.success(t("userActivated"));
      }

      // Refresh list
      const data = await getAdminUsers(token, {
        role: roleFilter === "all" ? undefined : roleFilter,
        limit,
        offset: page * limit,
      });
      setUserData(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedUpdateUser"));
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return (
          <Badge variant="default" className="gap-1">
            <IconShieldCheck className="size-3" aria-hidden="true" />
            Super Admin
          </Badge>
        );
      case "admin":
        return (
          <Badge variant="secondary" className="gap-1">
            <IconShield className="size-3" aria-hidden="true" />
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Customer
          </Badge>
        );
    }
  };

  const columns = [
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (user: AdminUser) => (
        <Text as="span" variant="body-sm" className="font-medium">
          {user.email}
        </Text>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user: AdminUser) => getRoleBadge(user.role),
    },
    {
      key: "is_active",
      header: "Status",
      render: (user: AdminUser) => (
        <Badge variant={user.is_active ? "default" : "destructive"}>
          {user.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "order_count",
      header: "Orders",
      sortable: true,
      render: (user: AdminUser) => (
        <Text as="span" variant="body-sm">{user.order_count}</Text>
      ),
    },
    {
      key: "total_spent",
      header: "Total Spent",
      sortable: true,
      render: (user: AdminUser) => (
        <Text as="span" variant="body-sm" className="font-medium">
          €{Number(user.total_spent).toFixed(2)}
        </Text>
      ),
    },
    {
      key: "created_at",
      header: "Joined",
      sortable: true,
      render: (user: AdminUser) => (
        <Text variant="muted-sm">
          {new Date(user.created_at).toLocaleDateString()}
        </Text>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (user: AdminUser) => (
        <Row gap="element">
          {isSuperAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditingUser(user);
                setNewRole(user.role);
              }}
            >
              Change Role
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(user);
            }}
          >
            {user.is_active ? "Deactivate" : "Activate"}
          </Button>
        </Row>
      ),
    },
  ];

  const totalPages = userData ? Math.ceil(userData.total / limit) : 0;

  return (
    <Container padding="md">
      <Stack gap="section">
        <Row justify="between" align="center">
          <Text as="h1" variant="heading-xl">
            Users
          </Text>
          <Row gap="group">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!token) return;
                try {
                  await downloadCsv("/admin/users/export", "users.csv", token);
                } catch {
                  toast.error(t("exportFailed"));
                }
              }}
            >
              {t("exportCsv")}
            </Button>
          </Row>
        </Row>

        <Card>
          <CardContent padding="none">
            {loading ? (
              <Stack gap="element" className="p-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </Stack>
            ) : (
              <>
                <DataTable
                  data={userData?.users ?? []}
                  columns={columns}
                  keyExtractor={(user) => user.id}
                />
                {totalPages > 1 && (
                  <Row justify="between" align="center" className="p-4 border-t border-border-subtle">
                    <Text variant="muted-sm">
                      Showing {page * limit + 1} to{" "}
                      {Math.min((page + 1) * limit, userData?.total ?? 0)} of{" "}
                      {userData?.total} users
                    </Text>
                    <Row gap="element">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= totalPages - 1}
                      >
                        Next
                      </Button>
                    </Row>
                  </Row>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* Change Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for {editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <Stack gap="group">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <Row gap="element">
                      <role.icon className="size-4" aria-hidden="true" />
                      {role.label}
                    </Row>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Stack>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={saving || newRole === editingUser?.role}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
