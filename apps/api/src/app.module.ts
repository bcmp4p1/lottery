import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './database/data-source';
import { AuthModule } from './auth/auth.module';
import { DrawsModule } from './draws/draws.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildDataSourceOptions(config.getOrThrow<string>('DATABASE_URL')),
    }),
    AuthModule,
    DrawsModule,
    TicketsModule,
    UsersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
