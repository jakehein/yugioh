import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'The email address of the User',
    example: 'a@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'The password of the User',
    example: 'hello123',
  })
  @IsNotEmpty()
  @Length(6, 30)
  password!: string;
}
