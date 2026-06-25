import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ForgotPasswordDto } from '../users/dto/forgot-password.dto';
import { ResetPasswordDto } from '../users/dto/reset-password.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('refresh')
    async refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshTokens(
            dto.userId,
            dto.refreshToken,
        );
    }

    @Patch('change-password')
    @UseGuards(JwtAuthGuard)
    async changePassword(
        @Req() req,
        @Body() body: { currentPassword: string; newPassword: string }
    ) {
        return this.authService.changeOwnPassword(
            req.user.userId,
            body.currentPassword,
            body.newPassword
        );
    }


    @UseGuards(AuthGuard('jwt'))
    @Post('logout')
    async logout(@Req() req) {
        await this.authService.logout(req.user.sub);
        return { message: 'Logout successful' };
    }

    @Post('forgot-password')
    forgot(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    reset(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.token, dto.newPassword);
    }
}
