import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
    Matches,
} from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8, {
        message: 'Password must be at least 8 characters long.',
    })
    password: string;
}