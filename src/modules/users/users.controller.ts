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
import type { UpdateUserDto } from './dto/update-user.dto';
import { updateUserSchema } from './dto/update-user.dto';
import type { QueryUserDto } from './dto/query-user.dto';
import { queryUserSchema } from './dto/query-user.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { LanguageInterceptor } from '../../common/interceptors/language.interceptor';
import { TranslationService } from '../../common/services/translation.service';
import { Lang } from '../../common/decorators/i18n.decorator';

@Controller('users')
@UseInterceptors(LanguageInterceptor) // Agrega el idioma a todas las respuestas
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly translation: TranslationService,
  ) {}

  /**
   * Crear un nuevo usuario
   * POST /users
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createUserSchema)) createUserDto: CreateUserDto,
    @Lang() lang: string,
  ) {
    console.log('**********************************************')
    console.log('Received create user request with data:', createUserDto);
    const user = await this.usersService.create(createUserDto);

    // No retornar la contraseña
    const { password, ...userWithoutPassword } = user;

    return {
      message: this.translation.translate('user.created', {}, lang),
      data: userWithoutPassword,
    };
  }

  /**
   * Obtener todos los usuarios con paginación
   * GET /users?page=1&limit=10&search=john&role=admin
   */
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(queryUserSchema)) queryDto: QueryUserDto,
    @Lang() lang: string,
  ) {
    const result = await this.usersService.findAll(queryDto);

    // Remover contraseñas de todos los usuarios
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
   * Obtener un usuario por ID
   * GET /users/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Lang() lang: string) {
    const user = await this.usersService.findOne(id);
    const { password, ...userWithoutPassword } = user;

    return {
      data: userWithoutPassword,
    };
  }

  /**
   * Actualizar un usuario
   * PATCH /users/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) updateUserDto: UpdateUserDto,
    @Lang() lang: string,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    const { password, ...userWithoutPassword } = user;

    return {
      message: this.translation.translate('user.updated', {}, lang),
      data: userWithoutPassword,
    };
  }

  /**
   * Eliminar un usuario (soft delete)
   * DELETE /users/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Lang() lang: string) {
    await this.usersService.remove(id);

    return {
      message: this.translation.translate('user.deleted', {}, lang),
    };
  }

  /**
   * Restaurar un usuario eliminado
   * POST /users/:id/restore
   */
  @Post(':id/restore')
  async restore(@Param('id') id: string, @Lang() lang: string) {
    const user = await this.usersService.restore(id);
    const { password, ...userWithoutPassword } = user;

    return {
      message: this.translation.translate('user.restored', {}, lang),
      data: userWithoutPassword,
    };
  }

  /**
   * Obtener perfil del usuario actual
   * GET /users/me/profile
   */
  @Get('me/profile')
  async getProfile(@Lang() lang: string) {
    // Aquí normalmente obtendrías el ID del usuario del JWT
    // const userId = req.user.id;
    
    return {
      message: this.translation.translate('user.profile.retrieved', {}, lang),
      // data: userProfile
    };
  }

  /**
   * Actualizar perfil del usuario actual
   * PATCH /users/me/profile
   */
  @Patch('me/profile')
  async updateProfile(
    @Body(new ZodValidationPipe(updateUserSchema)) updateUserDto: UpdateUserDto,
    @Lang() lang: string,
  ) {
    // Aquí normalmente obtendrías el ID del usuario del JWT
    // const userId = req.user.id;
    
    return {
      message: this.translation.translate('user.profile.updated', {}, lang),
      // data: updatedProfile
    };
  }
}