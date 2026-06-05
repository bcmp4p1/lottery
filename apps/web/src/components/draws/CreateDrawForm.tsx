"use client";

import { useState, type SubmitEvent } from "react";
import type { CreateDrawDto } from "@lottery/shared";
import { api } from "@/lib/api";
import { validateCreateDraw, type CreateDrawErrors } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { ErrorText } from "@/components/ui/ErrorText";

const EMPTY_FORM = {
  title: "",
  description: "",
  priceDollars: "1.00",
  maxTickets: "100",
  drawDate: "",
  guaranteedWinner: true,
};

export const CreateDrawForm = ({ onCreated }: { onCreated: () => void }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<CreateDrawErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validateCreateDraw(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setError(null);
    setBusy(true);
    try {
      const dto: CreateDrawDto = {
        title: form.title,
        description: form.description,
        ticketPrice: Math.round(parseFloat(form.priceDollars) * 100),
        drawDate: new Date(form.drawDate).toISOString(),
        maxTickets: parseInt(form.maxTickets, 10),
        guaranteedWinner: form.guaranteedWinner,
      };
      await api.createDraw(dto);
      setForm(EMPTY_FORM);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create draw");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
    >
      <TextField
        label="Title"
        value={form.title}
        error={fieldErrors.title}
        onChange={(e) => update("title", e.target.value)}
      />
      <TextAreaField
        label="Description"
        rows={3}
        value={form.description}
        error={fieldErrors.description}
        onChange={(e) => update("description", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Ticket price ($)"
          type="number"
          step="0.01"
          min="0"
          value={form.priceDollars}
          error={fieldErrors.priceDollars}
          onChange={(e) => update("priceDollars", e.target.value)}
        />
        <TextField
          label="Max tickets"
          type="number"
          min="1"
          value={form.maxTickets}
          error={fieldErrors.maxTickets}
          onChange={(e) => update("maxTickets", e.target.value)}
        />
      </div>
      <TextField
        label="Draw date"
        type="datetime-local"
        value={form.drawDate}
        error={fieldErrors.drawDate}
        onChange={(e) => update("drawDate", e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.guaranteedWinner}
          onChange={(e) => update("guaranteedWinner", e.target.checked)}
        />
        Guaranteed winner (draw the winning number from sold tickets only)
      </label>
      {error && <ErrorText>{error}</ErrorText>}
      <Button type="submit" disabled={busy}>
        {busy ? "Creating…" : "Create draw"}
      </Button>
    </form>
  );
}
