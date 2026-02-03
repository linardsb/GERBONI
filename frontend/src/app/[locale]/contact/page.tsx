"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/elements/container";
import { Section } from "@/components/elements/section";
import { Row } from "@/components/elements/row";
import { Stack } from "@/components/elements/stack";
import { Text } from "@/components/elements/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/card";
import { PageHeader } from "@/components/compositions/page-header";
import { Grid } from "@/components/elements/grid";
import { Input } from "@/components/elements/input";
import { Textarea } from "@/components/elements/textarea";
import { Button } from "@/components/elements/button";
import { Label } from "@/components/elements/label";
import { IconMail, IconPhone, IconMessageCircle, IconClock, IconSend } from "@tabler/icons-react";
import { toast } from "sonner";

export default function ContactPage() {
  const t = useTranslations("contact");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    orderNumber: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const contactMethods = [
    {
      icon: IconMail,
      title: t("methods.email.title"),
      value: t("methods.email.value"),
      description: t("methods.email.description"),
    },
    {
      icon: IconMessageCircle,
      title: t("methods.chat.title"),
      value: t("methods.chat.value"),
      description: t("methods.chat.description"),
    },
    {
      icon: IconPhone,
      title: t("methods.phone.title"),
      value: t("methods.phone.value"),
      description: t("methods.phone.description"),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success(t("form.success"));

    setFormData({
      name: "",
      email: "",
      orderNumber: "",
      subject: "",
      message: "",
    });
    setSending(false);
  };

  return (
    <>
      <Section spacing="default">
        <Container>
          <PageHeader
            label={t("label")}
            title={t("title")}
            description={t("description")}
            align="center"
          />

          <Grid cols={3} gap="lg">
            {contactMethods.map((method) => (
              <Card key={method.title}>
                <CardHeader>
                  <Row gap="group">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <method.icon className="size-5 text-primary" aria-hidden="true" />
                    </div>
                    <Stack gap="none">
                      <CardTitle className="text-lg">{method.title}</CardTitle>
                      <Text variant="muted-sm">{method.description}</Text>
                    </Stack>
                  </Row>
                </CardHeader>
                <CardContent>
                  <Text variant="body-md" className="font-medium">{method.value}</Text>
                </CardContent>
              </Card>
            ))}
          </Grid>

          <Card className="mx-auto max-w-2xl mt-section">
            <CardHeader className="text-center">
              <Row gap="element" justify="center">
                <IconClock className="size-5 text-primary" aria-hidden="true" />
                <CardTitle>{t("responsePriority.title")}</CardTitle>
              </Row>
              <Text variant="muted">{t("responsePriority.order")}</Text>
            </CardHeader>
          </Card>
        </Container>
      </Section>

      <Section spacing="default" background="muted">
        <Container>
          <Grid cols={2} gap="xl">
            <Stack gap="group">
              <Text as="h2" variant="heading-lg">{t("sendMessage.title")}</Text>
              <Text variant="muted">{t("sendMessage.description")}</Text>

              <Card>
                <CardContent className="pt-6">
                  <Stack gap="sm">
                    <Text variant="heading-xs">{t("specialized.title")}</Text>
                    <Stack gap="element">
                      <Row gap="element">
                        <span className="text-primary">•</span>
                        <Text variant="muted-sm">
                          <strong>{t("specialized.bulk")}:</strong> sales@gerboni.lv
                        </Text>
                      </Row>
                      <Row gap="element">
                        <span className="text-primary">•</span>
                        <Text variant="muted-sm">
                          <strong>{t("specialized.custom")}:</strong> custom@gerboni.lv
                        </Text>
                      </Row>
                      <Row gap="element">
                        <span className="text-primary">•</span>
                        <Text variant="muted-sm">
                          <strong>{t("specialized.international")}:</strong> international@gerboni.lv
                        </Text>
                      </Row>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>

            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit}>
                  <Stack gap="group">
                    <Grid cols={2} gap="group">
                      <Stack gap="element">
                        <Label htmlFor="name">{t("form.name")} *</Label>
                        <Input
                          id="name"
                          placeholder={t("form.namePlaceholder")}
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </Stack>
                      <Stack gap="element">
                        <Label htmlFor="email">{t("form.email")} *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={t("form.emailPlaceholder")}
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </Stack>
                    </Grid>

                    <Grid cols={2} gap="group">
                      <Stack gap="element">
                        <Label htmlFor="orderNumber">{t("form.orderNumber")}</Label>
                        <Input
                          id="orderNumber"
                          placeholder={t("form.orderNumberPlaceholder")}
                          value={formData.orderNumber}
                          onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                        />
                      </Stack>
                      <Stack gap="element">
                        <Label htmlFor="subject">{t("form.subject")} *</Label>
                        <Input
                          id="subject"
                          placeholder={t("form.subjectPlaceholder")}
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          required
                        />
                      </Stack>
                    </Grid>

                    <Stack gap="element">
                      <Label htmlFor="message">{t("form.message")} *</Label>
                      <Textarea
                        id="message"
                        placeholder={t("form.messagePlaceholder")}
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </Stack>

                    <Button type="submit" size="lg" disabled={sending} className="w-full">
                      {sending ? (
                        t("form.sending")
                      ) : (
                        <>
                          <IconSend className="mr-2 size-4" aria-hidden="true" />
                          {t("form.send")}
                        </>
                      )}
                    </Button>
                  </Stack>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Container>
      </Section>
    </>
  );
}
