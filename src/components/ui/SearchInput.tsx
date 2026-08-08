import * as React from "react"
import { Search } from "lucide-react"
import { Input, type InputProps } from "./Input"
import { cn } from "../../lib/utils"

const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className={cn("relative", className)}>
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
        <Input
          type="search"
          className="pl-9 pr-4 rounded-full bg-background border-transparent focus-visible:border-accent"
          placeholder="Search..."
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }
