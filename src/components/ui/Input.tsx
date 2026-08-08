import * as React from "react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          className={`
            flex h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors
            file:border-0 file:bg-transparent file:text-sm file:font-medium
            placeholder:text-slate-400
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            ${
              error
                ? "border-red-500 focus-visible:ring-red-500/50"
                : "border-slate-200 focus-visible:ring-slate-400 focus-visible:border-slate-400 hover:border-slate-300"
            }
            ${className}
          `}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm font-medium text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"
