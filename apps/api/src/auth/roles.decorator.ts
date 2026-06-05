import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@lottery/shared';

export const ROLES_KEY = 'roles';

/** Restrict a route to the given roles. Use together with RolesGuard. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
