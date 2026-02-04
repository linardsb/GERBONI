"use client";

import { useState, useEffect } from "react";
import { IconX, IconMail, IconGift } from "@tabler/icons-react";
import { Button3D } from "@/components/elements/button-3d";
import { Input } from "@/components/elements/input";
import { Text } from "@/components/elements/text";
import { Stack } from "@/components/elements/stack";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const POPUP_DELAY = 5000; // 5 seconds
const STORAGE_KEY = "gerboni_newsletter_dismissed";

export function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    // Check if popup was previously dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Show popup after delay
    const timer = setTimeout(() => {
      setIsOpen(true);
      // Set session flag to prevent exit intent from showing
      sessionStorage.setItem("newsletter_shown_this_session", "true");
    }, POPUP_DELAY);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "popup" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to subscribe");
      }

      setSubscribed(true);
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());

      // Close after showing success message
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      toast.error("Error", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-background rounded-lg shadow-xl animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <IconX className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-8">
          {subscribed ? (
            <Stack gap="md" className="items-center text-center py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-bg">
                <IconGift className="h-8 w-8 text-success" />
              </div>
              <Text as="h2" variant="heading-md">You&apos;re In!</Text>
              <Text variant="muted">
                Check your inbox for your 10% discount code. Happy shopping!
              </Text>
            </Stack>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                  <IconMail className="h-7 w-7 text-primary" />
                </div>
                <Text as="h2" variant="heading-lg">Get 10% Off</Text>
                <Text variant="muted" className="mt-2">
                  Subscribe to our newsletter and receive 10% off your first order, plus exclusive deals and new arrivals.
                </Text>
              </div>

              <form onSubmit={handleSubmit}>
                <Stack gap="md">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <Button3D type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? "Subscribing..." : "Get My 10% Off"}
                  </Button3D>
                </Stack>
              </form>

              <Text variant="muted-sm" align="center" className="mt-4">
                By subscribing, you agree to receive marketing emails. Unsubscribe anytime.
              </Text>

              <button
                onClick={handleClose}
                className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                No thanks, I&apos;ll pay full price
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
