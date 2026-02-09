"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { IconShoppingCart } from "@/components/icons";
import { Button } from "@/components/elements/button";
import { Skeleton } from "@/components/elements/skeleton";
import { Container } from "@/components/elements/container";
import { Stack } from "@/components/elements/stack";
import { PageHeader } from "@/components/compositions/page-header";
import { EmptyState } from "@/components/compositions/empty-state";
import { CartItem } from "@/components/compositions/cart-item";
import { CartSummary } from "@/components/compositions/cart-summary";
import { CheckoutForm } from "@/components/compositions/checkout-form";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  createOrder,
  type ShippingInfo,
} from "@/lib/api";
import { useAuthStore, useCartStore } from "@/lib/store";
import { toast } from "sonner";

export default function CartPage() {
  const t = useTranslations("cart");
  const router = useRouter();
  const { token, guestSession } = useAuthStore();
  const { cart, setCart } = useCartStore();
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [discountCode, setDiscountCode] = useState<string | undefined>();

  const [shipping, setShipping] = useState<ShippingInfo>({
    name: "",
    address: "",
    city: "",
    postal_code: "",
    country: "Latvia",
  });
  const [guestEmail, setGuestEmail] = useState("");

  useEffect(() => {
    if (!token && !guestSession) {
      setLoading(false);
      return;
    }

    getCart(token, guestSession?.session_token)
      .then(setCart)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [token, guestSession, setCart]);

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    try {
      const updatedCart = await updateCartItem(
        itemId,
        quantity,
        token,
        guestSession?.session_token
      );
      setCart(updatedCart);
    } catch {
      toast.error(t("updateError"));
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      const updatedCart = await removeCartItem(
        itemId,
        token,
        guestSession?.session_token
      );
      setCart(updatedCart);
      toast.success(t("itemRemoved"));
    } catch {
      toast.error(t("removeError"));
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const order = await createOrder(
        shipping,
        token,
        guestSession?.session_token,
        !token ? guestEmail : undefined,
        discountCode,
      );
      router.push(`/checkout/success?order_id=${order.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("checkoutFailed"));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Container padding="md" size="md">
        <Stack gap="section">
          <Skeleton className="h-10 w-48" />
          <Stack gap="md">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </Stack>
        </Stack>
      </Container>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Container padding="md" size="md">
        <EmptyState
          icon={IconShoppingCart}
          title={t("empty")}
          description={t("emptyDescription")}
        >
          <Button asChild>
            <Link href="/products">{t("continueShopping")}</Link>
          </Button>
        </EmptyState>
      </Container>
    );
  }

  if (showCheckout) {
    return (
      <Container padding="md" size="sm">
        <CheckoutForm
          shipping={shipping}
          onShippingChange={setShipping}
          guestEmail={guestEmail}
          onGuestEmailChange={setGuestEmail}
          showGuestEmail={!token}
          total={Number(cart.total)}
          processing={processing}
          onSubmit={handleCheckout}
          onBack={() => setShowCheckout(false)}
        />
      </Container>
    );
  }

  const itemCountText = t("itemsInCart", { count: cart.item_count });

  return (
    <Container padding="md" size="md">
      <PageHeader
        title={t("title")}
        description={itemCountText}
      />

      <Stack gap="section">
        <Stack gap="md">
          {cart.items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
            />
          ))}
        </Stack>

        <CartSummary
          total={Number(cart.total)}
          onCheckout={(code) => {
            setDiscountCode(code);
            setShowCheckout(true);
          }}
        />
      </Stack>
    </Container>
  );
}
