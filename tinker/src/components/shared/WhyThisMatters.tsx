import React from "react";
import { UseFormRegisterReturn, FieldError } from "react-hook-form";
import { cn } from "../../utils/cn";

interface Props {
  registration: UseFormRegisterReturn;
  error?: FieldError;
  className?: string;
}

export function WhyThisMatters({ registration, error, className }: Props) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-sm font-medium text-[var(--ui-success)]">
        Why This Matters <span className="text-red-400">*</span>
      </label>
      <p className="mb-2 text-xs text-[var(--ui-text-3)]">
        References must include context on why they are relevant to this project.
      </p>
      <textarea
        {...registration}
        className={cn(
          "input min-h-[80px] w-full resize-y",
          error && "border-red-500 focus:ring-red-500"
        )}
        placeholder="Explain how this reference will help you (minimum 10 characters)..."
        data-testid="input-why-this-matters"
      />
      {error && (
        <p className="text-red-400 text-xs font-medium" data-testid="error-why-this-matters">
          {error.message}
        </p>
      )}
    </div>
  );
}
