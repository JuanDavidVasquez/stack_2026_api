import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { JwtStrategy, JwtRefreshStrategy } from './strategies';
import { ActiveUserGuard, JwtAuthGuard, JwtRefreshGuard, RolesGuard } from './guards';
import { RefreshToken, User } from 'src/models';
import { UsersModule } from '../users/users.module';
import { CommonModule } from 'src/common/common.module';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') as any,
        },
      }),
    }),
    UsersModule,
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshTokenService,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
    JwtRefreshGuard,
    RolesGuard,
    // Guards globales en orden de ejecución
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // 1. Validar JWT
    },
    {
      provide: APP_GUARD,
      useClass: ActiveUserGuard, // 2. Validar usuario activo y verificado
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // 3. Validar roles
    },
  ],
  exports: [AuthService, RefreshTokenService],
})
export class AuthModule {}