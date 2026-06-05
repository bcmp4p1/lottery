import Link from "next/link";
import type { Draw } from "@lottery/shared";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatPrice } from "@/lib/format";

export const DrawCard = ({ draw }: { draw: Draw }) => {
  return (
    <Link
      href={`/draws/${draw.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-500"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h2 className="font-semibold">{draw.title}</h2>
        <StatusBadge status={draw.status} />
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
        {draw.description}
      </p>
      <dl className="grid grid-cols-2 gap-1 text-sm text-gray-500 dark:text-gray-400">
        <dt>Price</dt>
        <dd className="text-right font-medium text-gray-900 dark:text-gray-100">
          {formatPrice(draw.ticketPrice)}
        </dd>
        <dt>Draw date</dt>
        <dd className="text-right">{formatDate(draw.drawDate)}</dd>
        <dt>Tickets sold</dt>
        <dd className="text-right">
          {draw.ticketsSold} / {draw.maxTickets}
        </dd>
      </dl>
    </Link>
  );
}
