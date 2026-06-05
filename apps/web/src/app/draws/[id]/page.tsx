"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DrawStatus } from "@lottery/shared";
import { api } from "@/lib/api";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/components/AuthProvider";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ErrorText } from "@/components/ui/ErrorText";
import { Loading } from "@/components/ui/Loading";
import { formatDate, formatPrice } from "@/lib/format";

const DrawDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { data: draw, error, loading, reload } = useAsync(() => api.getDraw(id), [id]);

  const [busy, setBusy] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [lastTicketNumber, setLastTicketNumber] = useState<number | null>(null);

  const handleBuy = async () => {
    setBusy(true);
    setBuyError(null);
    try {
      const ticket = await api.buyTicket(id);
      setLastTicketNumber(ticket.ticketNumber);
      await reload();
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading />;
  if (error || !draw) return <ErrorText>Failed to load: {error ?? "Not found"}</ErrorText>;

  const datePassed = new Date(draw.drawDate).getTime() <= Date.now();
  const soldOut = draw.ticketsSold >= draw.maxTickets;
  const canBuy = draw.status === DrawStatus.Open && !soldOut && !datePassed;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/"
        className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
      >
        ← All draws
      </Link>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{draw.title}</h1>
          <StatusBadge status={draw.status} />
        </div>
        <p className="mb-6 whitespace-pre-line text-gray-700 dark:text-gray-300">
          {draw.description}
        </p>

        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-gray-500 dark:text-gray-400">Ticket price</dt>
          <dd className="text-right font-medium">{formatPrice(draw.ticketPrice)}</dd>
          <dt className="text-gray-500 dark:text-gray-400">Draw date</dt>
          <dd className="text-right">{formatDate(draw.drawDate)}</dd>
          <dt className="text-gray-500 dark:text-gray-400">Tickets sold</dt>
          <dd className="text-right">
            {draw.ticketsSold} / {draw.maxTickets}
          </dd>
          <dt className="text-gray-500 dark:text-gray-400">Guaranteed winner</dt>
          <dd className="text-right">{draw.guaranteedWinner ? "Yes" : "No"}</dd>
        </dl>

        {draw.status === DrawStatus.Finished && (
          <div className="mt-6 rounded-md bg-blue-50 p-4 text-center dark:bg-blue-950">
            <p className="text-sm text-blue-700 dark:text-blue-300">Winning number</p>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-200">
              {draw.winningNumber ?? "— no winner —"}
            </p>
          </div>
        )}

        <div className="mt-6 space-y-3 border-t border-gray-100 pt-6 dark:border-gray-800">
          {lastTicketNumber !== null && (
            <div className="rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-950 dark:text-green-300">
              🎟️ You bought ticket <strong>#{lastTicketNumber}</strong>! Good luck.
            </div>
          )}

          {!isAuthenticated ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <Link
                href="/login"
                className="text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Sign in
              </Link>{" "}
              to buy a ticket.
            </p>
          ) : canBuy ? (
            <Button fullWidth className="py-3" disabled={busy} onClick={handleBuy}>
              {busy ? "Buying…" : `Buy a ticket — ${formatPrice(draw.ticketPrice)}`}
            </Button>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {soldOut
                ? "This draw is sold out."
                : datePassed
                  ? "This draw has closed."
                  : "This draw is not open for purchase."}
            </p>
          )}

          {buyError && <ErrorText>{buyError}</ErrorText>}
        </div>
      </div>
    </div>
  );
};

export default DrawDetailPage;
