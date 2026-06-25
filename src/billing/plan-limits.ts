import { CompanyPlan } from '../company/enums/company-plan';

export const PLAN_LIMITS = {
    [CompanyPlan.FREE]: {
        users: 1,
        auditRetentionDays: 7,
        canExportData: false,
    },
    [CompanyPlan.PRO]: {
        users: 10,
        auditRetentionDays: 90,
        canExportData: true,
    },
    [CompanyPlan.ENTERPRISE]: {
        users: Infinity,
        auditRetentionDays: 365,
        canExportData: true,
    },
};
