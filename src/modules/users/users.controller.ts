// src/modules/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import type { CreateUserDto } from './dto/create-user.dto';
import { createUserSchema } from './dto/create-user.dto';
import type { UpdateStatusDto, UpdateUserDto } from './dto/update-user.dto';
import { updateStatusSchema, updateUserSchema } from './dto/update-user.dto';
import type { QueryUserDto } from './dto/query-user.dto';
import { queryUserSchema } from './dto/query-user.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { LanguageInterceptor } from '../../common/interceptors/language.interceptor';
import { TranslationService } from '../../common/services/translation.service';
import { Lang } from '../../common/decorators/i18n.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, UserStatus } from 'src/models/enums';

@Controller('users')
@UseInterceptors(LanguageInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly translation: TranslationService,
  ) {}

  /**
   * Crear usuario - Solo ADMIN
   */
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createUserSchema)) createUserDto: CreateUserDto,
    @Lang() lang: string,
  ) {
    const user = await this.usersService.create(createUserDto);
    const { password, ...userWithoutPassword } = user;

    return {
      message: this.translation.translate('user.created', {}, lang),
      data: userWithoutPassword,
    };
  }

  /**
   * Listar usuarios - Solo ADMIN y MODERATOR
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async findAll(
    @Query(new ZodValidationPipe(queryUserSchema)) queryDto: QueryUserDto,
    @Lang() lang: string,
  ) {
    const result = await this.usersService.findAll(queryDto);

    const usersWithoutPasswords = result.data.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      message: this.translation.translate('user.list', {}, lang),
      data: usersWithoutPasswords,
      meta: result.meta,
    };
  }

  /**
   * Obtener usuario por ID - Usuario autenticado puede ver su propio perfil o ADMIN cualquiera
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
    @Lang() lang: string,
  ) {
    // Verificar si es el mismo usuario o es admin
    if (currentUser.id !== id && currentUser.role !== UserRole.ADMIN) {
      const { password, loginAttempts, lockedUntil, ...limitedData } = 
        await this.usersService.findOne(id);
      
      return {
        data: limitedData,
      };
    }

    const user = await this.usersService.findOne(id);
    const { password, ...userWithoutPassword } = user;

    return {
      data: userWithoutPassword,
    };
  }

  /**
   * Actualizar usuario - Solo el mismo usuario o ADMIN
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: any,
    @Lang() lang: string,
  ) {
    // Solo el mismo usuario o admin puede actualizar
    if (currentUser.id !== id && currentUser.role !== UserRole.ADMIN) {
      throw new Error('No tienes permisos para actualizar este usuario');
    }

    // Los usuarios normales no pueden cambiar su rol
    if (currentUser.role !== UserRole.ADMIN && updateUserDto.role) {
      delete updateUserDto.role;
    }

    const user = await this.usersService.update(id, updateUserDto);
    const { password, ...userWithoutPassword } = user;

    return {
      message: this.translation.translate('user.updated', {}, lang),
      data: userWithoutPassword,
    };
  }

  /**
   * Eliminar usuario - Solo ADMIN
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Lang() lang: string) {
    await this.usersService.remove(id);

    return {
      message: this.translation.translate('user.deleted', {}, lang),
    };
  }

  /**
   * Restaurar usuario - Solo ADMIN
   */
  @Post(':id/restore')
  @Roles(UserRole.ADMIN)
  async restore(@Param('id') id: string, @Lang() lang: string) {
    const user = await this.usersService.restore(id);
    const { password, ...userWithoutPassword } = user;

    return {
      message: this.translation.translate('user.restored', {}, lang),
      data: userWithoutPassword,
    };
  }

  /**
   * Desbloquear cuenta - Solo ADMIN
   */
  @Post(':id/unlock')
  @Roles(UserRole.ADMIN)
  async unlockAccount(@Param('id') id: string, @Lang() lang: string) {
    await this.usersService.unlockAccount(id);

    return {
      message: this.translation.translate('user.unlocked', {}, lang),
    };
  }

  /**
   * Verificar email - Solo ADMIN
   */
  @Post(':id/verify-email')
  @Roles(UserRole.ADMIN)
  async verifyEmail(@Param('id') id: string, @Lang() lang: string) {
    await this.usersService.verifyEmail(id);

    return {
      message: this.translation.translate('user.emailVerified', {}, lang),
    };
  }

  /**
   * Cambiar estado - Solo ADMIN
   */
  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async changeStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateStatusSchema)) body: UpdateStatusDto,
    @Lang() lang: string,
  ) {
    const user = await this.usersService.changeStatus(id, body.status as UserStatus);
    const { password, ...userWithoutPassword } = user;

    return {
      message: this.translation.translate('user.statusChanged', {}, lang),
      data: userWithoutPassword,
    };
  }

  /**
   * Obtener perfil del usuario actual
   */
  @Get('me/profile')
  async getProfile(@CurrentUser() user: any, @Lang() lang: string) {
    const fullUser = await this.usersService.findOne(user.id);
    const { password, ...userWithoutPassword } = fullUser;

    return {
      message: this.translation.translate('user.profile.retrieved', {}, lang),
      data: userWithoutPassword,
    };
  }

  /**
   * Actualizar perfil del usuario actual
   */
  @Patch('me/profile')
  async updateProfile(
    @Body(new ZodValidationPipe(updateUserSchema)) updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
    @Lang() lang: string,
  ) {
    // Usuarios no pueden cambiar su propio rol
    delete updateUserDto.role;

    const updatedUser = await this.usersService.update(user.id, updateUserDto);
    const { password, ...userWithoutPassword } = updatedUser;

    return {
      message: this.translation.translate('user.profile.updated', {}, lang),
      data: userWithoutPassword,
    };
  }
}