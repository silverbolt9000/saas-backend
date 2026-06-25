import { IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';

export class CreateCompanyDto {
    @IsNotEmpty()
    name!: string;

    @Matches(/^\d{14}$/)
    cnpj!: string;

    @IsEmail()
    email!: string;
}
