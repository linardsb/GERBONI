"use client";

import { useEffect, useRef, useState } from "react";
import { IconMessageCircle, IconX, IconSend, IconRobot } from "@tabler/icons-react";
import { Button } from "@/components/elements/button";
import { Card } from "@/components/elements/card";
import { Input } from "@/components/elements/input";
import { ScrollArea } from "@/components/elements/scroll-area";
import { useChatStore, useAuthStore, type ChatMessage } from "@/lib/store";
import { chatWebSocket, type WebSocketMessage } from "@/lib/websocket";

export function ChatWidget() {
  const { isOpen, messages, isTyping, toggleChat, addMessage, setTyping } = useChatStore();
  const { token, guestSession } = useAuthStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleMessage = (data: WebSocketMessage) => {
      if (data.type === "message" && data.content) {
        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.content,
          timestamp: new Date(),
        });
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
  }, [addMessage, setTyping]);

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
    }
  }, [isOpen, token, guestSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    chatWebSocket.sendMessage(input.trim());
    setInput("");
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={toggleChat}
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 shadow-lg"
      >
        {isOpen ? (
          <IconX className="h-6 w-6" />
        ) : (
          <IconMessageCircle className="h-6 w-6" />
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 border-b bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex h-10 w-10 items-center justify-center bg-primary-foreground/20">
              <IconRobot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">GERBONI Support</h3>
              <p className="text-xs text-primary-foreground/80">AI Assistant</p>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <IconMessageCircle className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">
                  Hi! How can I help you today?
                  <br />
                  Ask about orders, products, or refunds.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="mb-4 flex justify-start">
                <div className="bg-muted px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!input.trim()}>
                <IconSend className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}
