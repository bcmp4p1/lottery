"use client";

import { useState } from "react";
import { DrawStatus, type Draw } from "@lottery/shared";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorText } from "@/components/ui/ErrorText";
import { formatPrice } from "@/lib/format";

export const AdminDrawRow = ({
  draw,
  onChange,
}: {
  draw: Draw;
  onChange: () => void;
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAction = async (action: (id: string) => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action(draw.id);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${draw.title}"? This cannot be undone.`)) {
      void runAction(api.deleteDraw);
    }
  };

  return (
    <li className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{draw.title}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatPrice(draw.ticketPrice)} · {draw.ticketsSold}/{draw.maxTickets} sold
            {draw.status === DrawStatus.Finished && (
              <> · winning #: {draw.winningNumber ?? "none"}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={draw.status} />
          {draw.status === DrawStatus.Draft && (
            <Button className="px-3 py-1 text-sm" disabled={busy} onClick={() => runAction(api.publishDraw)}>
              Publish
            </Button>
          )}
          {draw.status === DrawStatus.Open && (
            <Button className="px-3 py-1 text-sm" disabled={busy} onClick={() => runAction(api.closeDraw)}>
              Close
            </Button>
          )}
          {draw.status === DrawStatus.Closed && (
            <Button className="px-3 py-1 text-sm" disabled={busy} onClick={() => runAction(api.drawWinner)}>
              Draw winner
            </Button>
          )}
          {draw.ticketsSold === 0 && (
            <Button
              variant="danger"
              className="px-3 py-1 text-sm"
              disabled={busy}
              onClick={handleDelete}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
      {error && <ErrorText className="mt-2">{error}</ErrorText>}
    </li>
  );
}
