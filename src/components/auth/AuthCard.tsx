import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../ui/Card"
import { cn } from "../../lib/utils"

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  error?: string;
  className?: string;
}

export function AuthCard({ children, title, description, error, className }: AuthCardProps) {
  return (
    <Card className={cn("w-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 rounded-2xl bg-white/80 backdrop-blur-xl", className)}>
      <CardHeader className="space-y-2 pb-6 pt-8 px-8 text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight text-text-main">{title}</CardTitle>
        {description && (
            <CardDescription className="text-sm text-text-muted mt-2">{description}</CardDescription>
        )}
        {error && (
          <p className="text-sm text-error mt-2">{error}</p>
        )}
      </CardHeader>
      <CardContent className="px-8 pb-8">
        {children}
      </CardContent>
    </Card>
  )
}
