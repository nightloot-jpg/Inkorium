import * as React from "react"

export function Card({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
