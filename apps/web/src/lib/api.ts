import type {
  CreateDrawDto,
  Draw,
  PublicUser,
  Ticket,
  TicketWithResult,
} from "@lottery/shared";
import { getSupabase } from "./supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Low-level fetch wrapper. Attaches the Supabase access token when authed. */
const request = async <T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> => {
  const { method = "GET", body, auth = false } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (auth) {
    const {
      data: { session },
    } = await getSupabase().auth.getSession();
    if (!session) throw new ApiError(401, "Not authenticated");
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const message = await extractError(res);
    throw new ApiError(res.status, message);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

const extractError = async (res: Response): Promise<string> => {
  try {
    const data = await res.json();
    const m = data?.message;
    return Array.isArray(m) ? m.join(", ") : (m ?? res.statusText);
  } catch {
    return res.statusText;
  }
}

export const api = {
  // Public
  listDraws: () => request<Draw[]>("/draws"),
  getDraw: (id: string) => request<Draw>(`/draws/${id}`),

  // User
  getMe: () => request<PublicUser>("/me", { auth: true }),
  buyTicket: (drawId: string) =>
    request<Ticket>(`/draws/${drawId}/tickets`, { method: "POST", auth: true }),
  myTickets: () => request<TicketWithResult[]>("/me/tickets", { auth: true }),

  // Admin
  listAllDraws: () => request<Draw[]>("/admin/draws", { auth: true }),
  createDraw: (dto: CreateDrawDto) =>
    request<Draw>("/admin/draws", { method: "POST", body: dto, auth: true }),
  publishDraw: (id: string) =>
    request<Draw>(`/admin/draws/${id}/publish`, { method: "POST", auth: true }),
  closeDraw: (id: string) =>
    request<Draw>(`/admin/draws/${id}/close`, { method: "POST", auth: true }),
  drawWinner: (id: string) =>
    request<Draw>(`/admin/draws/${id}/draw`, { method: "POST", auth: true }),
  deleteDraw: (id: string) =>
    request<void>(`/admin/draws/${id}`, { method: "DELETE", auth: true }),
};
