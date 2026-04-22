import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-gray-400 pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={[
              "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-900",
              "placeholder:text-gray-400 outline-none transition-all duration-150",
              "focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
              error
                ? "border-red-400 focus:ring-red-400 focus:border-red-400"
                : "border-gray-300",
              leftIcon ? "pl-10" : "",
              rightIcon ? "pr-10" : "",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 text-gray-400">{rightIcon}</span>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
