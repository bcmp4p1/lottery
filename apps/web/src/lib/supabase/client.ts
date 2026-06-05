import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client (singleton). Used only for auth — sign up / in /
 * out and session management. All application data goes through the NestJS API.
 */
let client: SupabaseClient | undefined;

export const getSupabase = (): SupabaseClient => {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
  }
  return client;
}
