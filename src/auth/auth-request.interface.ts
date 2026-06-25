import { Request } from 'express';

export interface JwtUserPayload {
    userId: string;
    companyId: string;
    role: string;
}

export interface AuthRequest extends Request {
    user: JwtUserPayload;
}
