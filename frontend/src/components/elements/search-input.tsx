import * as React from "react"

import { cn } from "@/lib/utils"

interface SearchInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  onSearch?: (value: string) => void
  buttonText?: string
}

function SearchInput({
  className,
  placeholder = "Search",
  onSearch,
  buttonText = "Enter",
  ...props
}: SearchInputProps) {
  const [value, setValue] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch?.(value)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative flex items-center border-b border-border-subtle focus-within:border-foreground transition-colors",
        className
      )}
    >
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-transparent py-3 text-display text-lg placeholder:text-muted-foreground/50 focus:outline-none"
        {...props}
      />
      <button
        type="submit"
        className="text-label px-4 hover:text-primary transition-colors"
      >
        {buttonText}
      </button>
    </form>
  )
}

export { SearchInput }
