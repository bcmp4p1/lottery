import { DrawStatus } from "@lottery/shared";

/** Price is stored in cents. */
export const formatPrice = (cents: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export const statusStyles: Record<DrawStatus, string> = {
  [DrawStatus.Draft]: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
  [DrawStatus.Open]: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  [DrawStatus.Closed]: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  [DrawStatus.Finished]: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
};
