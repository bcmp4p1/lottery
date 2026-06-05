import { UserRole } from './user.enums';

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
}
