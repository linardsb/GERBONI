"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { IconRobot } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Text } from "@/components/elements/text"

const chatMessageVariants = cva(
  "max-w-[80%] px-4 py-2 transition-colors duration-fast",
  {
    variants: {
      role: {
        user: "bg-primary text-primary-foreground ml-auto rounded-bl-lg rounded-tl-lg rounded-tr-lg",
        assistant: "bg-muted text-foreground mr-auto rounded-br-lg rounded-tr-lg rounded-tl-lg",
      },
    },
    defaultVariants: {
      role: "assistant",
    },
  }
)

export interface ChatMessageProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "role">,
    VariantProps<typeof chatMessageVariants> {
  /** The message content */
  content: string
  /** When the message was sent */
  timestamp?: Date
  /** Whether to show the assistant avatar */
  showAvatar?: boolean
}

function ChatMessage({
  className,
  role = "assistant",
  content,
  timestamp,
  showAvatar = true,
  ...props
}: ChatMessageProps) {
  const isAssistant = role === "assistant"

  return (
    <div
      data-slot="chat-message"
      data-role={role}
      className={cn(
        "mb-4 flex",
        isAssistant ? "justify-start" : "justify-end"
      )}
      {...props}
    >
      <div className={cn("flex gap-2", isAssistant ? "flex-row" : "flex-row-reverse")}>
        {/* Avatar for assistant */}
        {isAssistant && showAvatar && (
          <div
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-hidden="true"
          >
            <IconRobot className="size-3" />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div className={cn(chatMessageVariants({ role, className }))}>
            <p className="whitespace-pre-wrap text-sm">{content}</p>
          </div>

          {/* Timestamp */}
          {timestamp && (
            <Text
              variant="fine"
              className={cn(
                "px-1",
                isAssistant ? "text-left" : "text-right"
              )}
            >
              {timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Typing indicator component for chat
 */
function ChatTypingIndicator({ className }: { className?: string }) {
  return (
    <div
      data-slot="chat-typing-indicator"
      className={cn("mb-4 flex justify-start", className)}
      aria-live="polite"
      aria-label="Assistant is typing"
    >
      <div className="flex gap-2">
        <div
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-hidden="true"
        >
          <IconRobot className="size-3" />
        </div>
        <div className="bg-muted px-4 py-3 rounded-br-lg rounded-tr-lg rounded-tl-lg">
          <div className="flex gap-1">
            <span
              className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]"
              aria-hidden="true"
            />
            <span
              className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]"
              aria-hidden="true"
            />
            <span
              className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export { ChatMessage, ChatTypingIndicator, chatMessageVariants }
