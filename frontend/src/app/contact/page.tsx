"use client";

import { useState } from "react";
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

const contactMethods = [
  {
    icon: IconMail,
    title: "Email",
    value: "support@gerboni.lv",
    description: "Response within 24 hours",
    priority: "high",
  },
  {
    icon: IconMessageCircle,
    title: "Live Chat",
    value: "Available on website",
    description: "9:00-18:00 EET weekdays",
    priority: "highest",
  },
  {
    icon: IconPhone,
    title: "Phone",
    value: "+371 2XXX XXXX",
    description: "Weekdays 10:00-17:00 EET",
    priority: "normal",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    orderNumber: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Message sent!", {
      description: "We'll get back to you within 24 hours.",
    });

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
            label="Support"
            title="Contact Us"
            description="Have a question or need help? Our team is here to assist you. Choose your preferred contact method below."
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
                <CardTitle>Response Priority</CardTitle>
              </Row>
              <Text variant="muted">Chat &gt; Email &gt; Phone</Text>
            </CardHeader>
          </Card>
        </Container>
      </Section>

      <Section spacing="default" background="muted">
        <Container>
          <Grid cols={2} gap="xl">
            <Stack gap="group">
              <Text as="h2" variant="heading-lg">Send Us a Message</Text>
              <Text variant="muted">
                Fill out the form and we&apos;ll get back to you within 24 hours. For faster assistance, include your order number if applicable.
              </Text>

              <Card>
                <CardContent className="pt-6">
                  <Stack gap="sm">
                    <Text variant="heading-xs">Specialized Inquiries</Text>
                    <Stack gap="element">
                      <Row gap="element">
                        <span className="text-primary">•</span>
                        <Text variant="muted-sm">
                          <strong>Bulk orders (25+):</strong> sales@gerboni.lv
                        </Text>
                      </Row>
                      <Row gap="element">
                        <span className="text-primary">•</span>
                        <Text variant="muted-sm">
                          <strong>Custom designs:</strong> custom@gerboni.lv
                        </Text>
                      </Row>
                      <Row gap="element">
                        <span className="text-primary">•</span>
                        <Text variant="muted-sm">
                          <strong>International shipping:</strong> international@gerboni.lv
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
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </Stack>
                      <Stack gap="element">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </Stack>
                    </Grid>

                    <Grid cols={2} gap="group">
                      <Stack gap="element">
                        <Label htmlFor="orderNumber">Order Number</Label>
                        <Input
                          id="orderNumber"
                          placeholder="e.g., #1234"
                          value={formData.orderNumber}
                          onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                        />
                      </Stack>
                      <Stack gap="element">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                          id="subject"
                          placeholder="What's this about?"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          required
                        />
                      </Stack>
                    </Grid>

                    <Stack gap="element">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        placeholder="How can we help you?"
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </Stack>

                    <Button type="submit" size="lg" disabled={sending} className="w-full">
                      {sending ? (
                        "Sending..."
                      ) : (
                        <>
                          <IconSend className="mr-2 size-4" aria-hidden="true" />
                          Send Message
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
