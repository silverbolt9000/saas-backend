import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { LoginDto } from './dto/login.dto';
import { User } from '../users/schemas/users.schema';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private jwtService: JwtService,
        private usersService: UsersService,
    ) { }

    // 🔐 GERA ACCESS + REFRESH
    async generateTokens(user: {
        userId: string;
        companyId: string;
        role: string;
    }) {
        const payload: JwtPayload = {
            sub: user.userId,
            companyId: user.companyId,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload);

        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '1d',
        });

        return { accessToken, refreshToken };
    }

    // 💾 SALVA REFRESH TOKEN HASHED
    async saveRefreshToken(userId: string, refreshToken: string) {
        const hash = await bcrypt.hash(refreshToken, 10);
        await this.usersService.updateRefreshToken(userId, hash);
    }

    // 🔑 LOGIN
    async login(dto: LoginDto) {
        const user = await this.userModel.findOne({
            email: dto.email,
            active: true,
        });
        console.log('LOGIN EMAIL:', dto.email);
        console.log('USER FOUND (SEM STATUS):', user);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordMatch = await bcrypt.compare(
            dto.password,
            user.passwordHash,
        );

        console.log('PASSWORD DIGITADA:', dto.password);
        console.log('PASSWORD HASH DB:', user.passwordHash);
        console.log('BCRYPT RESULT:', passwordMatch);

        if (!passwordMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // 🧠 tokens centralizados
        const { accessToken, refreshToken } = await this.generateTokens({
            userId: user._id.toString(),
            companyId: user.companyId as any,
            role: user.role,
        });

        // 💾 salva refresh token no banco
        await this.saveRefreshToken(user._id.toString(), refreshToken);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                companyId: user.companyId,
            },
        };
    }

    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.userModel.findById(userId);

        if (!user || !user.refreshToken) {
            throw new UnauthorizedException('Access denied');
        }

        const refreshTokenMatches = await bcrypt.compare(
            refreshToken,
            user.refreshToken,
        );

        if (!refreshTokenMatches) {
            throw new UnauthorizedException('Access denied');
        }

        const { accessToken, refreshToken: newRefreshToken } =
            await this.generateTokens({
                userId: user._id.toString(),
                companyId: user.companyId as any,
                role: user.role,
            });

        await this.saveRefreshToken(user._id.toString(), newRefreshToken);

        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }

    async logout(userId: string) {
        await this.usersService.updateRefreshToken(userId, null);
    }

    async changeOwnPassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ) {
        const user = await this.userModel.findById(userId);

        if (!user) {
            throw new UnauthorizedException('Usuário não encontrado');
        }

        const isValid = await bcrypt.compare(
            currentPassword,
            user.passwordHash
        );

        if (!isValid) {
            throw new UnauthorizedException('Senha atual inválida');
        }

        const hash = await bcrypt.hash(newPassword, 10);

        user.passwordHash = hash;
        await user.save();

        return { message: 'Senha alterada com sucesso' };
    }

    async forgotPassword(email: string) {
        const user = await this.userModel.findOne({ email });

        if (!user) {
            return; // não revelar se email existe
        }

        const token = require('crypto').randomBytes(32).toString('hex');

        user.resetToken = token;
        user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

        await user.save();

        // aqui depois você conecta serviço de email
        console.log(`Reset link: http://localhost:4200/reset-password?token=${token}`);
    }

    async resetPassword(token: string, newPassword: string) {
        const user = await this.userModel.findOne({
            resetToken: token,
            resetTokenExpires: { $gt: new Date() },
        });

        if (!user) {
            throw new BadRequestException('Token inválido ou expirado');
        }

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        user.resetToken = undefined;
        user.resetTokenExpires = undefined;

        await user.save();
    }

}
