import { DrawStatus } from "@lottery/shared";
import { statusStyles } from "@/lib/format";

export const StatusBadge = ({ status }: { status: DrawStatus }) => {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
