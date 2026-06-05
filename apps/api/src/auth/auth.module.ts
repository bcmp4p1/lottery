import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileEntity } from '../database/entities/profile.entity';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileEntity])],
  providers: [AuthGuard, RolesGuard, AuthService],
  exports: [AuthGuard, RolesGuard, AuthService],
})
export class AuthModule {}
