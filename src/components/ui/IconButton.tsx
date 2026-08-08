import * as React from "react"
import { Button, type ButtonProps } from "./Button"

const IconButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "ghost", size = "icon", ...props }, ref) => {
    return (
      <Button
        className={className}
        variant={variant}
        size={size}
        ref={ref}
        {...props}
      />
    )
  }
)
IconButton.displayName = "IconButton"

export { IconButton }
