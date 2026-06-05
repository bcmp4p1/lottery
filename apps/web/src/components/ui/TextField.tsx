import { useId, type InputHTMLAttributes } from "react";
import { ErrorText } from "./ErrorText";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const TextField = ({
  label,
  error,
  id,
  className = "",
  ...props
}: TextFieldProps) => {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div>
      <label htmlFor={fieldId} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={fieldId}
        className={`w-full rounded-md border px-3 py-2 dark:bg-gray-800 ${
          error ? "border-red-500" : "border-gray-300 dark:border-gray-700"
        } ${className}`}
        {...props}
      />
      {error && <ErrorText className="mt-1">{error}</ErrorText>}
    </div>
  );
}
