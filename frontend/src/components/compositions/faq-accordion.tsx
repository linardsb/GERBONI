"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { IconChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Text } from "@/components/elements/text";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  category: string;
  icon?: React.ReactNode;
  items: FAQItem[];
}

interface FAQAccordionProps {
  categories: FAQCategory[];
  className?: string;
}

export function FAQAccordion({ categories, className }: FAQAccordionProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {categories.map((category) => (
        <div key={category.category}>
          <div className="flex items-center gap-2 mb-4">
            {category.icon}
            <Text as="h3" variant="heading-sm">{category.category}</Text>
          </div>
          <AccordionPrimitive.Root type="single" collapsible className="space-y-2">
            {category.items.map((item, index) => (
              <AccordionPrimitive.Item
                key={index}
                value={`${category.category}-${index}`}
                className="border rounded-lg overflow-hidden"
              >
                <AccordionPrimitive.Header className="flex">
                  <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between p-4 text-left font-medium transition-all hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
                    {item.question}
                    <IconChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <div className="p-4 pt-0">
                    <Text variant="muted">{item.answer}</Text>
                  </div>
                </AccordionPrimitive.Content>
              </AccordionPrimitive.Item>
            ))}
          </AccordionPrimitive.Root>
        </div>
      ))}
    </div>
  );
}
