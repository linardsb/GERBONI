"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  IconPlus,
  IconSend,
  IconTrash,
  IconEdit,
} from "@/components/icons";
import { Button } from "@/components/elements/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/card";
import { Input } from "@/components/elements/input";
import { Label } from "@/components/elements/label";
import { Badge } from "@/components/elements/badge";
import { Skeleton } from "@/components/elements/skeleton";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import {
  listCampaigns,
  createCampaign,
  updateCampaign,
  sendCampaign,
  deleteCampaign,
  getProducts,
  type Campaign,
  type CampaignCreate,
  type Product,
} from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  sending: "default",
  sent: "default",
  failed: "destructive",
};

export default function AdminNewslettersPage() {
  const t = useTranslations("admin");
  const { token } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [introText, setIntroText] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  useEffect(() => {
    if (token) {
      loadCampaigns();
      loadProducts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadCampaigns = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await listCampaigns(token);
      setCampaigns(data);
    } catch {
      toast.error(t("failedLoadCampaigns"));
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    if (!token) return;
    try {
      const data = await getProducts();
      setProducts(data);
    } catch {
      // Products are optional for campaigns
    }
  };

  const resetForm = () => {
    setTitle("");
    setSubject("");
    setIntroText("");
    setSelectedProductIds([]);
    setEditingId(null);
    setFormOpen(false);
  };

  const openEditForm = (campaign: Campaign) => {
    setTitle(campaign.title);
    setSubject(campaign.subject);
    setIntroText(campaign.intro_text);
    setSelectedProductIds(campaign.featured_product_ids || []);
    setEditingId(campaign.id);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!token || !title || !subject || !introText) {
      toast.error(t("fillRequiredFields"));
      return;
    }

    setSaving(true);
    try {
      const data: CampaignCreate = {
        title,
        subject,
        intro_text: introText,
        featured_product_ids: selectedProductIds.length > 0 ? selectedProductIds : undefined,
      };

      if (editingId) {
        await updateCampaign(editingId, data, token);
        toast.success(t("campaignUpdated"));
      } else {
        await createCampaign(data, token);
        toast.success(t("campaignCreated"));
      }

      resetForm();
      await loadCampaigns();
    } catch {
      toast.error(t("failedSaveCampaign"));
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (id: number) => {
    if (!token) return;
    if (!confirm(t("confirmSendCampaign"))) return;

    setSendingId(id);
    try {
      const result = await sendCampaign(id, token);
      toast.success(
        t("campaignSent", {
          sent: result.sent_count,
          total: result.recipient_count,
        })
      );
      await loadCampaigns();
    } catch {
      toast.error(t("failedSendCampaign"));
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm(t("confirmDeleteCampaign"))) return;

    try {
      await deleteCampaign(id, token);
      toast.success(t("campaignDeleted"));
      await loadCampaigns();
    } catch {
      toast.error(t("failedDeleteCampaign"));
    }
  };

  const toggleProduct = (productId: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  if (loading) {
    return (
      <Stack gap="group">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </Stack>
    );
  }

  return (
    <Stack gap="section" data-slot="admin-newsletters">
      <Row justify="between" className="items-center">
        <div>
          <Text as="h1" variant="heading-lg">{t("newsletters")}</Text>
          <Text variant="muted">{t("newslettersDescription")}</Text>
        </div>
        {!formOpen && (
          <Button onClick={() => setFormOpen(true)}>
            <IconPlus className="size-4 mr-2" aria-hidden="true" />
            {t("createCampaign")}
          </Button>
        )}
      </Row>

      {/* Create/Edit Form */}
      {formOpen && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? t("editCampaign") : t("newCampaign")}
            </CardTitle>
            <CardDescription>{t("campaignFormDescription")}</CardDescription>
          </CardHeader>
          <CardContent padding="md">
            <Stack gap="group">
              <Stack gap="element">
                <Label htmlFor="campaignTitle">{t("campaignTitle")}</Label>
                <Input
                  id="campaignTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("campaignTitlePlaceholder")}
                />
              </Stack>

              <Stack gap="element">
                <Label htmlFor="campaignSubject">{t("emailSubject")}</Label>
                <Input
                  id="campaignSubject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("emailSubjectPlaceholder")}
                />
              </Stack>

              <Stack gap="element">
                <Label htmlFor="introText">{t("introText")}</Label>
                <textarea
                  id="introText"
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  placeholder={t("introTextPlaceholder")}
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </Stack>

              {products.length > 0 && (
                <Stack gap="element">
                  <Label>{t("featuredProducts")}</Label>
                  <Row gap="element" className="flex-wrap">
                    {products.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => toggleProduct(product.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-sm border transition-colors duration-fast",
                          selectedProductIds.includes(product.id)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-primary/50"
                        )}
                      >
                        {product.city_name}
                      </button>
                    ))}
                  </Row>
                </Stack>
              )}

              <Row justify="end" gap="element">
                <Button variant="outline" onClick={resetForm}>
                  {t("cancel")}
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? t("saving") : editingId ? t("updateCampaign") : t("createCampaign")}
                </Button>
              </Row>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Campaign List */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent padding="md">
            <Stack gap="group" className="items-center py-section">
              <Text variant="muted">{t("noCampaigns")}</Text>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack gap="group">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardContent padding="md">
                <Row justify="between" className="items-start">
                  <Stack gap="element" className="flex-1">
                    <Row gap="group" className="items-center">
                      <Text variant="body-md" className="font-semibold">
                        {campaign.title}
                      </Text>
                      <Badge variant={STATUS_VARIANTS[campaign.status] || "secondary"}>
                        {campaign.status}
                      </Badge>
                    </Row>
                    <Text variant="muted-sm">
                      {t("subject")}: {campaign.subject}
                    </Text>
                    <Text variant="muted-sm" className="line-clamp-2">
                      {campaign.intro_text}
                    </Text>
                    {campaign.status !== "draft" && (
                      <Row gap="group">
                        <Text variant="muted-sm">
                          {t("recipients")}: {campaign.recipient_count}
                        </Text>
                        <Text variant="muted-sm">
                          {t("sent")}: {campaign.sent_count}
                        </Text>
                        {campaign.failed_count > 0 && (
                          <Text variant="error">
                            {t("failed")}: {campaign.failed_count}
                          </Text>
                        )}
                      </Row>
                    )}
                    <Text variant="muted-sm">
                      {new Date(campaign.created_at).toLocaleDateString()}
                      {campaign.sent_at && ` · ${t("sentAt")} ${new Date(campaign.sent_at).toLocaleDateString()}`}
                    </Text>
                  </Stack>

                  {campaign.status === "draft" && (
                    <Row gap="element">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => openEditForm(campaign)}
                        aria-label={t("editCampaign")}
                      >
                        <IconEdit className="size-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleSend(campaign.id)}
                        disabled={sendingId === campaign.id}
                        aria-label={t("sendCampaign")}
                      >
                        <IconSend className="size-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleDelete(campaign.id)}
                        aria-label={t("deleteCampaign")}
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </Row>
                  )}
                </Row>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
