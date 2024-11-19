import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'The title is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'The content is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'The content is required' })
  password: string;
}

