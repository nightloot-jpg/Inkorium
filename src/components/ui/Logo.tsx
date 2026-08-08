import * as React from "react"
import { cn } from "../../lib/utils"

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className, size = 'md', ...props }: LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  }

  return (
    <div className={cn("font-bold tracking-tight text-primary flex items-center gap-2 cursor-pointer select-none", sizeClasses[size], className)} {...props}>
      <span className="text-accent-magenta">I</span>nkorium
    </div>
  )
}
