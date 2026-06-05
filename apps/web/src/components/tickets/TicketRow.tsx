import Link from "next/link";
import { DrawStatus, type TicketWithResult } from "@lottery/shared";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format";

export const TicketRow = ({ ticket }: { ticket: TicketWithResult }) => {
  const finished = ticket.draw.status === DrawStatus.Finished;
  return (
    <li className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div>
        <Link
          href={`/draws/${ticket.draw.id}`}
          className="font-semibold hover:underline"
        >
          {ticket.draw.title}
        </Link>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ticket #{ticket.ticketNumber} · {formatDate(ticket.draw.drawDate)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {finished &&
          (ticket.isWinner ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">
              🏆 Winner!
            </span>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">
              Won: {ticket.draw.winningNumber ?? "—"}
            </span>
          ))}
        <StatusBadge status={ticket.draw.status} />
      </div>
    </li>
  );
}
