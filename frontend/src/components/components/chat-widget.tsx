"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import {
  IconMessageCircle,
  IconX,
  IconSend,
  IconRobot,
  IconPackage,
  IconHelp,
  IconRefresh,
} from "@/components/icons";
import { Button } from "@/components/elements/button";
import { Card } from "@/components/elements/card";
import { Input } from "@/components/elements/input";
import { ScrollArea } from "@/components/elements/scroll-area";
import { Text } from "@/components/elements/text";
import { Stack } from "@/components/elements/stack";
import { Row } from "@/components/elements/row";
import { ChatMessage, ChatTypingIndicator } from "@/components/components/chat-message";
import { useChatStore, useAuthStore, type ChatMessage as ChatMessageType } from "@/lib/store";
import { chatWebSocket, type WebSocketMessage } from "@/lib/websocket";
import { cn } from "@/lib/utils";

const CHAT_WIDGET_ID = "chat-widget-window";

export function ChatWidget() {
  const { isOpen, messages, isTyping, toggleChat, addMessage, setTyping } = useChatStore();
  const { token, guestSession } = useAuthStore();
  const locale = useLocale() as "en" | "lv";
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const t = {
    support: locale === "lv" ? "GERBONI Atbalsts" : "GERBONI Support",
    aiAssistant: locale === "lv" ? "AI Asistents" : "AI Assistant",
    online: locale === "lv" ? "Tiešsaistē" : "Online",
    welcomeTitle: locale === "lv" ? "Sveiki! Kā varam palīdzēt?" : "Hi! How can we help?",
    welcomeSubtitle: locale === "lv"
      ? "Jautājiet par pasūtījumiem, produktiem vai atmaksām."
      : "Ask about orders, products, or refunds.",
    placeholder: locale === "lv" ? "Rakstiet ziņu..." : "Type a message...",
    orderStatus: locale === "lv" ? "Pasūtījuma statuss" : "Order status",
    productHelp: locale === "lv" ? "Produktu palīdzība" : "Product help",
    refunds: locale === "lv" ? "Atmaksas" : "Refunds",
    openChat: locale === "lv" ? "Atvērt čatu" : "Open chat",
    closeChat: locale === "lv" ? "Aizvērt čatu" : "Close chat",
    sendMessage: locale === "lv" ? "Sūtīt ziņu" : "Send message",
  };

  useEffect(() => {
    const handleMessage = (data: WebSocketMessage) => {
      if (data.type === "message" && data.content) {
        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.content,
          timestamp: new Date(),
        });
        // Increment unread count if chat is closed
        if (!isOpen) {
          setUnreadCount((prev) => prev + 1);
        }
      } else if (data.type === "typing") {
        setTyping(data.status || false);
      } else if (data.type === "error" && data.message) {
        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        });
      }
    };

    const unsubscribe = chatWebSocket.onMessage(handleMessage);
    return unsubscribe;
  }, [addMessage, setTyping, isOpen]);

  useEffect(() => {
    if (isOpen) {
      chatWebSocket.connect().then(() => {
        if (token) {
          chatWebSocket.authenticate(token);
        } else if (guestSession) {
          chatWebSocket.setGuestSession(
            guestSession.session_token,
            guestSession.email || undefined
          );
        }
      });
      inputRef.current?.focus();
      // Clear unread count when opening
      setUnreadCount(0);
    }
  }, [isOpen, token, guestSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    chatWebSocket.sendMessage(input.trim());
    setInput("");
  };

  const handleQuickAction = (message: string) => {
    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    chatWebSocket.sendMessage(message);
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={toggleChat}
        size="icon"
        className="fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg transition-transform duration-normal hover:scale-105"
        aria-expanded={isOpen}
        aria-controls={CHAT_WIDGET_ID}
        aria-label={isOpen ? t.closeChat : t.openChat}
      >
        <span className="relative">
          {/* Message icon with fade transition */}
          <IconMessageCircle
            className={cn(
              "size-6 transition-all duration-normal",
              isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
            )}
            aria-hidden="true"
          />
          {/* Close icon with fade transition */}
          <IconX
            className={cn(
              "absolute inset-0 size-6 transition-all duration-normal",
              isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"
            )}
            aria-hidden="true"
          />
        </span>

        {/* Unread badge */}
        {unreadCount > 0 && !isOpen && (
          <span
            className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground"
            aria-label={`${unreadCount} ${locale === "lv" ? "nelasītas ziņas" : "unread messages"}`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card
          id={CHAT_WIDGET_ID}
          role="dialog"
          aria-modal="true"
          aria-label={t.support}
          data-slot="chat-widget"
          className="fixed bottom-24 right-6 z-50 flex w-[min(var(--size-chat-widget-width),calc(100vw-3rem))] h-[min(var(--size-chat-widget-height),calc(100vh-8rem))] flex-col overflow-hidden shadow-2xl border-2 animate-in fade-in slide-in-from-bottom-4 duration-normal"
        >
          {/* Header */}
          <div
            data-slot="chat-header"
            className="flex items-center gap-3 border-b bg-primary px-4 py-3 text-primary-foreground"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-primary-foreground/20">
              <IconRobot className="size-5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{t.support}</h3>
              <Row gap="element" className="items-center">
                {/* Online indicator */}
                <span className="size-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
                <p className="text-xs text-primary-foreground/80">{t.online}</p>
              </Row>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" data-slot="chat-messages">
            {messages.length === 0 ? (
              <Stack gap="section" align="center" className="h-full justify-center py-8">
                {/* Empty state */}
                <div className="rounded-full bg-muted p-4">
                  <IconMessageCircle className="size-10 text-muted-foreground" aria-hidden="true" />
                </div>
                <Stack gap="element" align="center">
                  <Text variant="heading-sm" align="center">{t.welcomeTitle}</Text>
                  <Text variant="muted-sm" align="center">{t.welcomeSubtitle}</Text>
                </Stack>

                {/* Quick actions */}
                <Stack gap="element" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleQuickAction(locale === "lv" ? "Kāds ir mana pasūtījuma statuss?" : "What's my order status?")}
                  >
                    <IconPackage className="size-4 mr-2" aria-hidden="true" />
                    {t.orderStatus}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleQuickAction(locale === "lv" ? "Man nepieciešama palīdzība ar produktu" : "I need help with a product")}
                  >
                    <IconHelp className="size-4 mr-2" aria-hidden="true" />
                    {t.productHelp}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleQuickAction(locale === "lv" ? "Kā es varu saņemt atmaksu?" : "How can I get a refund?")}
                  >
                    <IconRefresh className="size-4 mr-2" aria-hidden="true" />
                    {t.refunds}
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                    showAvatar={message.role === "assistant"}
                  />
                ))}

                {isTyping && <ChatTypingIndicator />}
              </>
            )}

            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t p-4"
            data-slot="chat-input"
          >
            <Row gap="element">
              <Input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.placeholder}
                className="flex-1"
                aria-label={t.placeholder}
                maxLength={500}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                aria-label={t.sendMessage}
              >
                <IconSend className="size-4" aria-hidden="true" />
              </Button>
            </Row>

            {/* Character count when approaching limit */}
            {input.length > 400 && (
              <Text
                variant="fine"
                className={cn(
                  "mt-1 text-right",
                  input.length >= 500 ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {input.length}/500
              </Text>
            )}
          </form>
        </Card>
      )}
    </>
  );
}
