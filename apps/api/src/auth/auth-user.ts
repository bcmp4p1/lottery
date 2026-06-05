import { UserRole } from '@lottery/shared';

/**
 * The authenticated principal AuthGuard attaches to each request: identity
 * (id, email) from the verified Supabase JWT, role from the DB.
 */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}
