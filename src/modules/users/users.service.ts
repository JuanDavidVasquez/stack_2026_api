import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { CryptoService } from 'src/common/services/crypto.service';
import { User } from 'src/models';
import { UserRole, UserStatus } from 'src/models/enums';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly cryptoService: CryptoService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user with email: ${createUserDto.email}`);

    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('user.emailExists');
    }

    const hashedPassword = await this.cryptoService.hashPassword(createUserDto.password);

    const user = this.usersRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      username: createUserDto.username,
      phone: createUserDto.phone,
      role: createUserDto.role as UserRole,
      status: UserStatus.PENDING,
    });

    const savedUser = await this.usersRepository.save(user);
    this.logger.log(`User created successfully: ${savedUser.id}`);

    return savedUser;
  }

  async findAll(queryDto: QueryUserDto) {
    const { page, limit, sortBy, sortOrder, search, role, isActive } = queryDto;

    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    if (search) {
      queryBuilder.andWhere(
        '(LOWER("user"."email") LIKE LOWER(:search) OR LOWER("user"."username") LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (role) {
      queryBuilder.andWhere('"user"."role" = :role', { role });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('"user"."is_active" = :isActive', { isActive });
    }

    // Mapeo de campos camelCase a snake_case
    const sortByMap: Record<string, string> = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      firstName: 'first_name',
      lastName: 'last_name',
      emailVerified: 'email_verified',
      emailVerifiedAt: 'email_verified_at',
      lastLoginAt: 'last_login_at',
      lastLoginIp: 'last_login_ip',
      loginAttempts: 'login_attempts',
      lockedUntil: 'locked_until',
    };

    const columnName = sortByMap[sortBy] || sortBy;
    queryBuilder.orderBy(`"user"."${columnName}"`, sortOrder);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('user.notFound');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ 
      where: { email: email.toLowerCase() },
      select: ['id', 'email', 'password', 'role', 'status', 'loginAttempts', 'lockedUntil', 'firstName', 'lastName', 'username'],
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.usersRepository.findOne({ 
      where: { username: username.toLowerCase() },
      select: ['id', 'email', 'password', 'role', 'status', 'loginAttempts', 'lockedUntil', 'firstName', 'lastName', 'username'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('user.emailExists');
      }
    }

    if (updateUserDto.password) {
      user.password = await this.cryptoService.hashPassword(updateUserDto.password);
    }

    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.firstName !== undefined) user.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName !== undefined) user.lastName = updateUserDto.lastName;
    if (updateUserDto.username) user.username = updateUserDto.username;
    if (updateUserDto.phone !== undefined) user.phone = updateUserDto.phone;
    if (updateUserDto.role) user.role = updateUserDto.role as UserRole;
    if (updateUserDto.avatar !== undefined) user.avatar = updateUserDto.avatar;

    const updatedUser = await this.usersRepository.save(user);
    
    this.logger.log(`User updated successfully: ${updatedUser.id}`);
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.softRemove(user);
    this.logger.log(`User soft deleted: ${id}`);
  }

  async restore(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException('user.notFound');
    }

    await this.usersRepository.restore(id);
    this.logger.log(`User restored: ${id}`);
    return await this.findOne(id);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return await this.cryptoService.verifyPassword(password, user.password);
  }

  async updateLastLogin(id: string, ip?: string): Promise<void> {
    const user = await this.findOne(id);
    user.updateLastLogin(ip);
    await this.usersRepository.save(user);
    this.logger.log(`Last login updated for user: ${id}`);
  }

  async incrementLoginAttempts(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.incrementLoginAttempts();

    if (user.loginAttempts >= 5) {
      user.lockAccount(30);
      this.logger.warn(`User account locked due to failed attempts: ${id}`);
    }

    await this.usersRepository.save(user);
  }

  async unlockAccount(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.unlockAccount();
    await this.usersRepository.save(user);
    this.logger.log(`User account unlocked: ${id}`);
  }

  async verifyEmail(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.verifyEmail();
    await this.usersRepository.save(user);
    this.logger.log(`Email verified for user: ${id}`);
  }

  async changeStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.findOne(id);
    user.status = status;
    const updatedUser = await this.usersRepository.save(user);
    this.logger.log(`User status changed to ${status}: ${id}`);
    return updatedUser;
  }
}