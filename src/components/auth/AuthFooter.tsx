import * as React from "react"
import { Link } from "@tanstack/react-router"

interface AuthFooterProps {
  text: string;
  linkText: string;
  linkTo: string;
}

export function AuthFooter({ text, linkText, linkTo }: AuthFooterProps) {
  return (
    <div className="mt-8 text-center">
      <p className="text-sm text-text-muted">
        {text && <span>{text} </span>}
        <Link to={linkTo as any} className="font-semibold text-primary hover:underline hover:text-primary-hover transition-colors">{linkText}</Link>
      </p>
    </div>
  )
}
