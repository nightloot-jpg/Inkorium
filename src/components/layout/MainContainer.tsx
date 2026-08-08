import * as React from "react"
import { cn } from "../../lib/utils"

interface MainContainerProps extends React.HTMLAttributes<HTMLElement> {}

export function MainContainer({ className, children, ...props }: MainContainerProps) {
  return (
    <main
      className={cn("flex-1 min-w-0 py-6", className)}
      {...props}
    >
      <div className="mx-auto w-full max-w-2xl">
        {children}
      </div>
    </main>
  )
}
