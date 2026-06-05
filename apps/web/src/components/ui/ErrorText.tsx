import type { ReactNode } from "react";

export const ErrorText = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <p className={`text-sm text-red-600 dark:text-red-400 ${className}`}>{children}</p>
  );
}
