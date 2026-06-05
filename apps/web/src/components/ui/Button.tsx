import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary:
    "border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800",
  danger:
    "border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950",
};

export const Button = ({
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`rounded-md px-4 py-2 font-medium transition disabled:opacity-50 ${
        variants[variant]
      } ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}
