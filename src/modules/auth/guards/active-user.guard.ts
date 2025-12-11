import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from 'src/modules/users/users.service';
import { UserStatus } from 'src/models/enums';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // El JwtAuthGuard se encarga de esto
    }

    // Obtener usuario completo de la BD
    const fullUser = await this.usersService.findOne(user.id);

    // Verificar si el email está verificado
    if (!fullUser.emailVerified) {
      throw new UnauthorizedException(
        'Debes verificar tu email antes de continuar. Revisa tu bandeja de entrada.'
      );
    }

    // Verificar si el usuario está activo
    if (fullUser.status !== UserStatus.ACTIVE) {
      if (fullUser.status === UserStatus.PENDING) {
        throw new UnauthorizedException(
          'Tu cuenta está pendiente de activación. Contacta al administrador.'
        );
      }
      if (fullUser.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedException(
          'Tu cuenta ha sido suspendida. Contacta al administrador.'
        );
      }
      if (fullUser.status === UserStatus.INACTIVE) {
        throw new UnauthorizedException(
          'Tu cuenta está inactiva. Contacta al administrador.'
        );
      }
    }

    // Verificar si está bloqueado
    if (fullUser.isLocked()) {
      const minutesLeft = Math.ceil(
        (fullUser.lockedUntil!.getTime() - Date.now()) / (1000 * 60)
      );
      throw new UnauthorizedException(
        `Tu cuenta está bloqueada temporalmente. Intenta de nuevo en ${minutesLeft} minutos.`
      );
    }

    return true;
  }
}