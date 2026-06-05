"use client";

import Link from "next/link";
import type { TicketWithResult } from "@lottery/shared";
import { api } from "@/lib/api";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/components/AuthProvider";
import { TicketRow } from "@/components/tickets/TicketRow";
import { Loading } from "@/components/ui/Loading";
import { ErrorText } from "@/components/ui/ErrorText";

const MyTicketsPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: tickets, error, loading } = useAsync(
    () => (isAuthenticated ? api.myTickets() : Promise.resolve<TicketWithResult[]>([])),
    [isAuthenticated],
  );

  if (authLoading) return <Loading />;
  if (!isAuthenticated)
    return (
      <p className="text-gray-600 dark:text-gray-400">
        <Link href="/login" className="text-indigo-600 hover:underline dark:text-indigo-400">
          Sign in
        </Link>{" "}
        to view your tickets.
      </p>
    );
  if (loading) return <Loading label="Loading tickets…" />;
  if (error) return <ErrorText>Failed to load: {error}</ErrorText>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My Tickets</h1>
      {tickets && tickets.length > 0 ? (
        <ul className="space-y-3">
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          You haven&apos;t bought any tickets yet.{" "}
          <Link href="/" className="text-indigo-600 hover:underline dark:text-indigo-400">
            Browse draws
          </Link>
          .
        </p>
      )}
    </div>
  );
};

export default MyTicketsPage;
