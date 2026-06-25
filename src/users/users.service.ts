/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument, UserRole } from './schemas/users.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
    ) { }

    async create(dto: CreateUserDto, companyId: string) {
        const exists = await this.userModel.findOne({
            email: dto.email,
            companyId: new Types.ObjectId(companyId),
        });

        if (exists) {
            throw new ConflictException('Usuário já existe nesta empresa');
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const passwordHash = await bcrypt.hash(dto.password, 10);

        return this.userModel.create({
            email: dto.email,
            passwordHash,
            role: dto.role ?? UserRole.USER,
            companyId: new Types.ObjectId(companyId),
        });
    }

    async findAllByCompany(companyId: string) {
        return this.userModel.find(
            { companyId: new Types.ObjectId(companyId), active: true },
            { passwordHash: 0 },
        );

    }

    async findById(id: string, companyId: string) {
        return this.userModel.findOne(
            { _id: id, companyId: new Types.ObjectId(companyId), active: true },
            { passwordHash: 0 },
        );
    }

    async anonymize(userId: string, companyId: string) {
        return this.userModel.findOneAndUpdate(
            { _id: userId, companyId: new Types.ObjectId(companyId) },
            {
                email: `anon_${userId}@anon.local`,
                active: false,
            },
            { new: true },
        );
    }

    async delete(userId: string, companyId: string) {
        return this.userModel.deleteOne({ _id: userId, companyId: new Types.ObjectId(companyId) });
    }

    async updateRefreshToken(userId: string, refreshToken: string | null) {
        await this.userModel.updateOne(
            { _id: userId },
            { refreshToken },
        );
    }


    async findByIdWithRefresh(userId: string) {
        return this.userModel.findById(userId);
    }

    async changePassword(id: string, newPassword: string) {
        const hash = await bcrypt.hash(newPassword, 10);

        await this.userModel.findByIdAndUpdate(id, {
            passwordHash: hash,
        });

        return { message: 'Senha atualizada com sucesso' };
    }


}
