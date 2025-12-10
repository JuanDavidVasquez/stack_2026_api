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
import { UserStatus } from 'src/models/enums';

@Controller('users')
@UseInterceptors(LanguageInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly translation: TranslationService,
  ) {}

  @Post()
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

  @Get()
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

  @Get(':id')
  async findOne(@Param('id') id: string, @Lang() lang: string) {
    const user = await this.usersService.findOne(id);
    const { password, ...userWithoutPassword } = user;

    return {
      data: userWithoutPassword,
    };
  }

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

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Lang() lang: string) {
    await this.usersService.remove(id);

    return {
      message: this.translation.translate('user.deleted', {}, lang),
    };
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string, @Lang() lang: string) {
    const user = await this.usersService.restore(id);
    const { password, ...userWithoutPassword } = user;

    return {
      message: this.translation.translate('user.restored', {}, lang),
      data: userWithoutPassword,
    };
  }

  @Post(':id/unlock')
  async unlockAccount(@Param('id') id: string, @Lang() lang: string) {
    await this.usersService.unlockAccount(id);

    return {
      message: this.translation.translate('user.unlocked', {}, lang),
    };
  }

  @Post(':id/verify-email')
  async verifyEmail(@Param('id') id: string, @Lang() lang: string) {
    await this.usersService.verifyEmail(id);

    return {
      message: this.translation.translate('user.emailVerified', {}, lang),
    };
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body('status') status: UserStatus,
    @Lang() lang: string,
  ) {
    const user = await this.usersService.changeStatus(id, status);
    const { password, ...userWithoutPassword } = user;

    return {
      message: this.translation.translate('user.statusChanged', {}, lang),
      data: userWithoutPassword,
    };
  }

  @Get('me/profile')
  async getProfile(@Lang() lang: string) {
    // TODO: Obtener userId del JWT token
    // const userId = req.user.id;
    
    return {
      message: this.translation.translate('user.profile.retrieved', {}, lang),
      // data: userProfile
    };
  }

  @Patch('me/profile')
  async updateProfile(
    @Body(new ZodValidationPipe(updateUserSchema)) updateUserDto: UpdateUserDto,
    @Lang() lang: string,
  ) {
    // TODO: Obtener userId del JWT token
    // const userId = req.user.id;
    
    return {
      message: this.translation.translate('user.profile.updated', {}, lang),
      // data: updatedProfile
    };
  }
}