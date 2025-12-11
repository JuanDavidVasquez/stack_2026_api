import { IsNotEmpty, IsString, MinLength, Matches, IsOptional } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'El token debe ser un texto' })
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string;

  @IsString({ message: 'La contraseña debe ser un texto' })
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'La contraseña debe contener al menos: una mayúscula, una minúscula, un número y un caracter especial (@$!%*?&)',
    },
  )
  newPassword: string;

  @IsString({ message: 'El email debe ser un texto' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString({ message: 'El código debe ser un texto' })
  @IsOptional()
  code: string;
}