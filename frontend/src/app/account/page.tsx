"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconUser,
  IconLock,
  IconMapPin,
  IconPackage,
  IconPlus,
  IconTruck,
  IconAlertCircle,
  IconCheck,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/elements/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/card";
import { Badge } from "@/components/elements/badge";
import { Input } from "@/components/elements/input";
import { Label } from "@/components/elements/label";
import { Separator } from "@/components/elements/separator";
import { Skeleton } from "@/components/elements/skeleton";
import { Container } from "@/components/elements/container";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { PageHeader } from "@/components/compositions/page-header";
import { EmptyState } from "@/components/compositions/empty-state";
import { AddressCard } from "@/components/compositions/address-card";
import { AddressForm } from "@/components/compositions/address-form";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  changePassword,
  getOrders,
  type Address,
  type AddressCreate,
  type AddressUpdate,
  type Order,
} from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type TabId = "profile" | "security" | "addresses" | "orders";

const tabs: { id: TabId; label: string; icon: typeof IconUser }[] = [
  { id: "profile", label: "Profile", icon: IconUser },
  { id: "security", label: "Security", icon: IconLock },
  { id: "addresses", label: "Addresses", icon: IconMapPin },
  { id: "orders", label: "Orders", icon: IconPackage },
];

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  paid: "default",
  processing: "default",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  refunded: "outline",
};

export default function AccountPage() {
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Load data based on active tab
  useEffect(() => {
    if (!token) return;

    if (activeTab === "addresses" && addresses.length === 0) {
      loadAddresses();
    }
    if (activeTab === "orders" && orders.length === 0) {
      loadOrders();
    }
  }, [activeTab, token]);

  const loadAddresses = async () => {
    if (!token) return;
    setAddressLoading(true);
    try {
      const data = await getAddresses(token);
      setAddresses(data);
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setAddressLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const data = await getOrders(token);
      setOrders(data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleAddressSubmit = async (data: AddressCreate | AddressUpdate) => {
    if (!token) return;
    setSavingAddress(true);
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, data, token);
        toast.success("Address updated");
      } else {
        await createAddress(data as AddressCreate, token);
        toast.success("Address added");
      }
      await loadAddresses();
      setEditingAddress(null);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (address: Address) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await deleteAddress(address.id, token);
      toast.success("Address deleted");
      await loadAddresses();
    } catch {
      toast.error("Failed to delete address");
    }
  };

  const handleSetDefault = async (address: Address) => {
    if (!token) return;
    try {
      await setDefaultAddress(address.id, token);
      toast.success("Default address updated");
      await loadAddresses();
    } catch {
      toast.error("Failed to set default address");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(
        { current_password: currentPassword, new_password: newPassword },
        token
      );
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (!token || !user) {
    return (
      <Container padding="md" size="md">
        <EmptyState
          icon={IconUser}
          title="Please sign in to view your account"
        >
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container padding="md" size="lg">
      <PageHeader
        title="Account Settings"
        description="Manage your profile, security, and preferences"
      />

      <div className="flex flex-col md:flex-row gap-section">
        {/* Sidebar Navigation */}
        <nav
          className="md:w-56 shrink-0"
          aria-label="Account navigation"
        >
          <Stack gap="element">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-group px-4 py-3 rounded-lg text-left transition-colors w-full",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                <tab.icon className="size-5" aria-hidden="true" />
                <Text as="span" variant="body-sm" className="font-medium">
                  {tab.label}
                </Text>
              </button>
            ))}
          </Stack>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your account details and registration information
                </CardDescription>
              </CardHeader>
              <CardContent padding="md">
                <Stack gap="group">
                  <Row justify="between" className="py-3 border-b border-border-subtle">
                    <Text variant="muted-sm">Email</Text>
                    <Text as="span" variant="body-sm" className="font-medium">
                      {user.email}
                    </Text>
                  </Row>
                  <Row justify="between" className="py-3 border-b border-border-subtle">
                    <Text variant="muted-sm">Account Type</Text>
                    <Badge variant={user.is_guest ? "secondary" : "default"}>
                      {user.is_guest ? "Guest" : "Registered"}
                    </Badge>
                  </Row>
                  <Row justify="between" className="py-3 border-b border-border-subtle">
                    <Text variant="muted-sm">Status</Text>
                    <Badge variant={user.is_active ? "default" : "destructive"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Row>
                  <Row justify="between" className="py-3">
                    <Text variant="muted-sm">Member Since</Text>
                    <Text as="span" variant="body-sm" className="font-medium">
                      {new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </Row>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent padding="md">
                <form onSubmit={handlePasswordChange}>
                  <Stack gap="group">
                    {passwordError && (
                      <div className="rounded-md bg-destructive/10 p-3 border border-destructive/20">
                        <Row gap="element">
                          <IconAlertCircle className="size-4 text-destructive" aria-hidden="true" />
                          <Text variant="error">{passwordError}</Text>
                        </Row>
                      </div>
                    )}

                    <Stack gap="element">
                      <Label htmlFor="current_password">Current Password</Label>
                      <Input
                        id="current_password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                    </Stack>

                    <Stack gap="element">
                      <Label htmlFor="new_password">New Password</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        aria-describedby="password-requirements"
                      />
                      <Text variant="muted-sm" id="password-requirements">
                        Must be at least 8 characters with uppercase, lowercase, and a number.
                      </Text>
                    </Stack>

                    <Stack gap="element">
                      <Label htmlFor="confirm_password">Confirm New Password</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                    </Stack>

                    <Button type="submit" disabled={changingPassword} className="w-fit">
                      {changingPassword ? "Changing Password..." : "Change Password"}
                    </Button>
                  </Stack>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Addresses Tab */}
          {activeTab === "addresses" && (
            <Stack gap="group">
              <Row justify="between" align="center">
                <Text as="h2" variant="heading-md">
                  Your Addresses
                </Text>
                <Button
                  onClick={() => {
                    setEditingAddress(null);
                    setAddressFormOpen(true);
                  }}
                >
                  <IconPlus className="size-4" aria-hidden="true" />
                  Add Address
                </Button>
              </Row>

              {addressLoading ? (
                <Stack gap="group">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </Stack>
              ) : addresses.length === 0 ? (
                <Card>
                  <CardContent padding="md">
                    <EmptyState
                      icon={IconMapPin}
                      title="No addresses yet"
                      description="Add a shipping address to make checkout faster."
                    >
                      <Button
                        onClick={() => {
                          setEditingAddress(null);
                          setAddressFormOpen(true);
                        }}
                      >
                        Add Your First Address
                      </Button>
                    </EmptyState>
                  </CardContent>
                </Card>
              ) : (
                <Stack gap="group">
                  {addresses.map((address) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      onEdit={(addr) => {
                        setEditingAddress(addr);
                        setAddressFormOpen(true);
                      }}
                      onDelete={handleDeleteAddress}
                      onSetDefault={handleSetDefault}
                    />
                  ))}
                </Stack>
              )}

              <AddressForm
                open={addressFormOpen}
                onOpenChange={setAddressFormOpen}
                address={editingAddress}
                onSubmit={handleAddressSubmit}
                isLoading={savingAddress}
              />
            </Stack>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <Stack gap="group">
              <Text as="h2" variant="heading-md">
                Order History
              </Text>

              {ordersLoading ? (
                <Stack gap="group">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </Stack>
              ) : orders.length === 0 ? (
                <Card>
                  <CardContent padding="md">
                    <EmptyState
                      icon={IconPackage}
                      title="No orders yet"
                      description="Start shopping to see your orders here."
                    >
                      <Button asChild>
                        <Link href="/products">Browse Products</Link>
                      </Button>
                    </EmptyState>
                  </CardContent>
                </Card>
              ) : (
                <Stack gap="group">
                  {orders.slice(0, 5).map((order) => (
                    <Card key={order.id}>
                      <CardContent padding="md" className="py-6">
                        <Stack gap="group">
                          <Row justify="between" align="start">
                            <Stack gap="element">
                              <Text as="span" variant="body-md" className="font-semibold">
                                Order #{order.id}
                              </Text>
                              <Text variant="muted-sm">
                                {new Date(order.created_at).toLocaleDateString()}
                              </Text>
                            </Stack>
                            <Badge variant={statusVariants[order.status] || "secondary"}>
                              {order.status}
                            </Badge>
                          </Row>

                          <Stack gap="element">
                            {order.items.slice(0, 2).map((item) => (
                              <Row key={item.id} gap="group">
                                <div className="size-10 bg-muted flex items-center justify-center p-1">
                                  <Image
                                    src={`/coats/${item.variant.product_image}`}
                                    alt={item.variant.product_city}
                                    width={32}
                                    height={32}
                                    className="h-full w-full object-contain"
                                  />
                                </div>
                                <Stack gap="none" className="flex-1 min-w-0">
                                  <Text as="span" variant="body-sm" className="font-medium truncate">
                                    {item.variant.product_city}
                                  </Text>
                                  <Text variant="muted-sm">
                                    {item.variant.color} / {item.variant.size} × {item.quantity}
                                  </Text>
                                </Stack>
                              </Row>
                            ))}
                            {order.items.length > 2 && (
                              <Text variant="muted-sm">
                                +{order.items.length - 2} more items
                              </Text>
                            )}
                          </Stack>

                          <Separator />

                          <Row justify="between" align="center">
                            <Row gap="element">
                              {order.tracking_number && (
                                <>
                                  <IconTruck className="size-4 text-muted-foreground" aria-hidden="true" />
                                  <Text variant="muted-sm">
                                    Tracking: {order.tracking_number}
                                  </Text>
                                </>
                              )}
                            </Row>
                            <Row gap="group">
                              <Text as="span" variant="body-md" className="font-semibold">
                                €{Number(order.total).toFixed(2)}
                              </Text>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/orders/${order.id}`}>Details</Link>
                              </Button>
                            </Row>
                          </Row>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}

                  {orders.length > 5 && (
                    <Button variant="outline" asChild>
                      <Link href="/orders">View All Orders ({orders.length})</Link>
                    </Button>
                  )}
                </Stack>
              )}
            </Stack>
          )}
        </div>
      </div>
    </Container>
  );
}
