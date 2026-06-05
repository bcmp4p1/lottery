import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '@lottery/shared';
import { ProfileEntity } from '../database/entities/profile.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profiles: Repository<ProfileEntity>,
  ) {}

  /**
   * Resolves a user's role from `profiles` (the source of truth for authz),
   * creating the row on first sight (defaults to user).
   */
  async resolveRole(id: string, email: string): Promise<UserRole> {
    const existing = await this.profiles.findOne({
      where: { id },
      select: { role: true },
    });
    if (existing) return existing.role;

    await this.profiles
      .createQueryBuilder()
      .insert()
      .values({ id, email })
      .orIgnore()
      .execute();
    return UserRole.User;
  }
}
