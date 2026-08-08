import * as React from "react"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, id, ...props }, ref) => {
    const generatedId = React.useId()
    const finalId = id || generatedId

    return (
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={finalId}
          ref={ref}
          className={`
            peer h-4 w-4 shrink-0 rounded-sm border border-slate-300 bg-white
            text-[#233B5D] accent-[#233B5D]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            hover:border-[#233B5D] transition-colors cursor-pointer
            ${className}
          `}
          {...props}
        />
        <label
          htmlFor={finalId}
          className="text-sm font-medium leading-none text-slate-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          {label}
        </label>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"
