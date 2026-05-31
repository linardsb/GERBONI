"use client";

import { useEffect, useState } from "react";
import { IconAlertTriangle } from "@/components/icons";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/elements/button";
import { Badge } from "@/components/elements/badge";
import { Card, CardContent } from "@/components/elements/card";
import { Input } from "@/components/elements/input";
import { Label } from "@/components/elements/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/elements/dialog";
import { Skeleton } from "@/components/elements/skeleton";
import { Container } from "@/components/elements/container";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { DataTable } from "@/components/admin/data-table";
import {
  getAdminProducts,
  getAdminProductVariants,
  updateVariant,
  downloadCsv,
  type AdminProduct,
  type AdminProductList,
  type AdminVariant,
} from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function AdminProductsPage() {
  const t = useTranslations("admin");
  const { token } = useAuthStore();
  const [productData, setProductData] = useState<AdminProductList | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 20;

  // Variant editing
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [variants, setVariants] = useState<AdminVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [editingVariant, setEditingVariant] = useState<AdminVariant | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await getAdminProducts(token, {
          limit,
          offset: page * limit,
        });
        setProductData(data);
      } catch {
        toast.error(t("failedLoadProducts"));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [token, page, t]);

  const handleProductClick = async (product: AdminProduct) => {
    if (!token) return;

    setEditingProduct(product);
    setVariantsLoading(true);

    try {
      const data = await getAdminProductVariants(product.id, token);
      setVariants(data);
    } catch {
      toast.error(t("failedLoadVariants"));
    } finally {
      setVariantsLoading(false);
    }
  };

  const handleEditVariant = (variant: AdminVariant) => {
    setEditingVariant(variant);
    setEditPrice(String(variant.price));
    setEditStock(String(variant.stock));
  };

  const handleSaveVariant = async () => {
    if (!token || !editingProduct || !editingVariant) return;

    setSaving(true);
    try {
      const updated = await updateVariant(
        editingProduct.id,
        editingVariant.id,
        {
          price: parseFloat(editPrice),
          stock: parseInt(editStock),
        },
        token
      );

      setVariants((prev) =>
        prev.map((v) => (v.id === updated.id ? updated : v))
      );
      setEditingVariant(null);
      toast.success(t("variantUpdated"));
    } catch {
      toast.error(t("failedUpdateVariant"));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "city_name",
      header: "Product",
      sortable: true,
      render: (product: AdminProduct) => (
        <Stack gap="none">
          <Text as="span" variant="body-sm" className="font-medium">
            {product.city_name}
          </Text>
          <Text variant="muted-sm">{product.city_name_lv}</Text>
        </Stack>
      ),
    },
    {
      key: "variant_count",
      header: "Variants",
      sortable: true,
      render: (product: AdminProduct) => (
        <Text as="span" variant="body-sm">{product.variant_count}</Text>
      ),
    },
    {
      key: "total_stock",
      header: "Total Stock",
      sortable: true,
      render: (product: AdminProduct) => (
        <Text as="span" variant="body-sm">{product.total_stock}</Text>
      ),
    },
    {
      key: "low_stock_count",
      header: "Low Stock",
      sortable: true,
      render: (product: AdminProduct) => (
        product.low_stock_count > 0 ? (
          <Badge variant="destructive" className="gap-1">
            <IconAlertTriangle className="size-3" aria-hidden="true" />
            {product.low_stock_count}
          </Badge>
        ) : (
          <Text variant="muted-sm">-</Text>
        )
      ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (product: AdminProduct) => (
        <Badge variant={product.is_active ? "default" : "secondary"}>
          {product.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (product: AdminProduct) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleProductClick(product);
          }}
        >
          Manage Stock
        </Button>
      ),
    },
  ];

  const variantColumns = [
    {
      key: "color",
      header: "Color",
      render: (variant: AdminVariant) => (
        <Text as="span" variant="body-sm">{variant.color}</Text>
      ),
    },
    {
      key: "size",
      header: "Size",
      render: (variant: AdminVariant) => (
        <Text as="span" variant="body-sm">{variant.size}</Text>
      ),
    },
    {
      key: "sku",
      header: "SKU",
      render: (variant: AdminVariant) => (
        <Text variant="muted-sm" className="font-mono text-xs">{variant.sku}</Text>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (variant: AdminVariant) => (
        <Text as="span" variant="body-sm" className="font-medium">
          €{Number(variant.price).toFixed(2)}
        </Text>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      render: (variant: AdminVariant) => (
        <Row gap="element" align="center">
          {variant.stock < 10 && (
            <IconAlertTriangle className="size-4 text-destructive" aria-hidden="true" />
          )}
          <Text
            as="span"
            variant="body-sm"
            className={variant.stock < 10 ? "text-destructive font-medium" : ""}
          >
            {variant.stock}
          </Text>
        </Row>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (variant: AdminVariant) => (
        <Button variant="ghost" size="sm" onClick={() => handleEditVariant(variant)}>
          Edit
        </Button>
      ),
    },
  ];

  const totalPages = productData ? Math.ceil(productData.total / limit) : 0;

  return (
    <Container padding="md">
      <Stack gap="section">
        <Row justify="between" align="center">
          <Text as="h1" variant="heading-xl">
            Products
          </Text>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!token) return;
              try {
                await downloadCsv("/admin/products/export", "products.csv", token);
              } catch {
                toast.error(t("exportFailed"));
              }
            }}
          >
            {t("exportCsv")}
          </Button>
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
                  data={productData?.products ?? []}
                  columns={columns}
                  keyExtractor={(product) => product.id}
                />
                {totalPages > 1 && (
                  <Row justify="between" align="center" className="p-4 border-t border-border-subtle">
                    <Text variant="muted-sm">
                      Showing {page * limit + 1} to{" "}
                      {Math.min((page + 1) * limit, productData?.total ?? 0)} of{" "}
                      {productData?.total} products
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

      {/* Variants Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct?.city_name} - Stock Management
            </DialogTitle>
          </DialogHeader>
          {variantsLoading ? (
            <Stack gap="element">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </Stack>
          ) : (
            <DataTable
              data={variants}
              columns={variantColumns}
              keyExtractor={(variant) => variant.id}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Variant Dialog */}
      <Dialog open={!!editingVariant} onOpenChange={() => setEditingVariant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Variant</DialogTitle>
          </DialogHeader>
          {editingVariant && (
            <Stack gap="group">
              <Text variant="muted">
                {editingVariant.color} / {editingVariant.size} ({editingVariant.sku})
              </Text>
              <Stack gap="element">
                <Label htmlFor="edit-price">Price (€)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
              </Stack>
              <Stack gap="element">
                <Label htmlFor="edit-stock">Stock</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  min="0"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                />
              </Stack>
            </Stack>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVariant(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVariant} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
