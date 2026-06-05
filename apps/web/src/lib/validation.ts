// Client-side credential validation. Kept in one place so login and signup
// surface the same messages through our own error UI (no native browser popups).

export const PASSWORD_MIN_LENGTH = 6;

export const validateEmail = (email: string): string | null => {
  if (!email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
  return null;
}

export const validatePassword = (
  password: string,
  min = PASSWORD_MIN_LENGTH,
): string | null => {
  if (!password) return "Password is required";
  if (password.length < min) return `Password must be at least ${min} characters`;
  return null;
}

// --- Create draw form ---
// Rules mirror the backend CreateDrawDto (class-validator) so the client catches
// the same problems before the request. The raw form values are strings.

export const DRAW_TITLE_MAX = 200;
export const DRAW_DESCRIPTION_MAX = 2000;
export const DRAW_MAX_TICKETS_LIMIT = 1_000_000;

export interface CreateDrawInput {
  title: string;
  description: string;
  priceDollars: string;
  maxTickets: string;
  drawDate: string;
}

export type CreateDrawErrors = Partial<Record<keyof CreateDrawInput, string>>;

export const validateCreateDraw = (input: CreateDrawInput): CreateDrawErrors => {
  const errors: CreateDrawErrors = {};

  if (!input.title.trim()) {
    errors.title = "Title is required";
  } else if (input.title.length > DRAW_TITLE_MAX) {
    errors.title = `Title must be at most ${DRAW_TITLE_MAX} characters`;
  }

  if (input.description.length > DRAW_DESCRIPTION_MAX) {
    errors.description = `Description must be at most ${DRAW_DESCRIPTION_MAX} characters`;
  }

  const price = Number(input.priceDollars);
  if (input.priceDollars.trim() === "" || Number.isNaN(price)) {
    errors.priceDollars = "Enter a valid price";
  } else if (price < 0) {
    errors.priceDollars = "Price cannot be negative";
  }

  const maxTickets = Number(input.maxTickets);
  if (input.maxTickets.trim() === "" || !Number.isInteger(maxTickets)) {
    errors.maxTickets = "Enter a whole number";
  } else if (maxTickets < 1) {
    errors.maxTickets = "Must be at least 1";
  } else if (maxTickets > DRAW_MAX_TICKETS_LIMIT) {
    errors.maxTickets = `Must be at most ${DRAW_MAX_TICKETS_LIMIT.toLocaleString()}`;
  }

  if (!input.drawDate) {
    errors.drawDate = "Draw date is required";
  } else {
    const date = new Date(input.drawDate);
    if (Number.isNaN(date.getTime())) {
      errors.drawDate = "Enter a valid date";
    } else if (date.getTime() <= Date.now()) {
      errors.drawDate = "Draw date must be in the future";
    }
  }

  return errors;
}
