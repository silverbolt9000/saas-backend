import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Company, CompanyDocument } from './company.schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { User, UserDocument } from '../users/schemas/users.schema';

@Injectable()
export class CompanyService {
    constructor(
        @InjectModel(Company.name)
        private companyModel: Model<CompanyDocument>,

        @InjectModel(User.name)
        private userModel: Model<UserDocument>,
    ) { }

    async findById(companyId: string) {
        if (!Types.ObjectId.isValid(companyId)) {
            throw new NotFoundException('Empresa inválida');
        }

        return this.companyModel.findOne({
            _id: new Types.ObjectId(companyId),
            active: true,
        });
    }

    async create(dto: CreateCompanyDto, sub: string) {
        const userObjectId = new Types.ObjectId(sub);
        const normalizedCnpj = dto.cnpj.replace(/\D/g, '');;
        console.log('USER ID RECEBIDO NO COMPANY CREATE:', sub);

        if (normalizedCnpj.length !== 14) {
            throw new BadRequestException('CNPJ inválido');
        }

        const session = await this.companyModel.db.startSession();
        session.startTransaction();

        try {
            // 🚫 verifica se já existe empresa com esse CNPJ
            const existingCompany = await this.companyModel
                .findOne({ cnpj: normalizedCnpj })
                .session(session);

            if (existingCompany) {
                throw new BadRequestException(
                    'Já existe empresa cadastrada com esse CNPJ',
                );
            }

            // 🚫 verifica se usuário já tem empresa
            const user = await this.userModel
                .findById(userObjectId)
                .session(session);

            if (!user) {
                throw new BadRequestException('Usuário não encontrado');
            }

            if (user.companyId) {
                throw new BadRequestException(
                    'Usuário já possui empresa cadastrada',
                );
            }

            // 🏢 cria empresa dentro da transaction
            const [company] = await this.companyModel.create(
                [
                    {
                        ...dto,
                        cnpj: normalizedCnpj,
                        ownerId: userObjectId,
                    },
                ],
                { session },
            );

            // 🔗 vincula empresa ao usuário
            await this.userModel.updateOne(
                { _id: userObjectId },
                { companyId: company._id },
                { session },
            );

            await session.commitTransaction();
            return company;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getMyCompany(userId: string) {
        const user = await this.userModel.findById(userId);

        if (!user) {
            throw new NotFoundException('Usuário não encontrado');
        }

        if (!user.companyId) {
            return null;
        }

        const company = await this.companyModel.findOne({
            _id: user.companyId,
            active: true,
        });

        // 🔥 empresa foi deletada mas user ainda tem companyId
        if (!company) {
            await this.userModel.updateOne(
                { _id: user._id },
                { $unset: { companyId: 1 } }
            );
            return null;
        }

        return company;
    }


}
