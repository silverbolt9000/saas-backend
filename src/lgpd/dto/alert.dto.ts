export class AlertDto {
    id?: string;
    title?: string;
    expiresAt?: Date;
    daysToExpire?: number;
    riskLevel?: 'safe' | 'warning' | 'critical';
}