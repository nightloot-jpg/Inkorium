import * as React from "react"
import { Controller } from "react-hook-form"
import type { Control, FieldValues, Path } from "react-hook-form"
import { Input } from "../ui/Input"

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function FormField<T extends FieldValues>({
  name,
  control,
  label,
  type = "text",
  placeholder = "",
  disabled = false
}: FormFieldProps<T>) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-main">
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <Input
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            error={fieldState.error?.message}
            {...field}
          />
        )}
      />
    </div>
  )
}
