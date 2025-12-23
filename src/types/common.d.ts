export interface SendOtpPayload {
    name: string;
    otp: string;
    email: string;
    subject?: string;
}

export interface SendInvitationPayload { 
    workspace_name: string;
    email: string;
    subject?: string;
}

export interface OtpInterface {
    salt: string,
    hash: string
    retry_limit: number
}

export type PlanAction =
  | "ADD_MEMBER"
  | "CREATE_PROJECT"
  | "AI_REQUEST";


interface eachPlanInterface {
    maxUsers: number
    maxProjects: number,
    maxTasksPerProject:  number,

    aiRequestsPerDay: number,
    aiEnabled: boolean,

    auditLogRetentionDays: number,
    commentsEnabled: boolean,

    canInviteUsers: boolean,
    canExportData: boolean,
    canAccessAuditLogs: boolean
}

export interface PlanInterface {
    FREE: eachPlanInterface,
    PRO: eachPlanInterface,
    ENTERPRISE: eachPlanInterface
}

type PrismaDriverAdapterMeta = {
    modelName?: string;
    driverAdapterError?: {
        cause?: {
            originalCode?: string;
            originalMessage?: string;
            kind?: string;
            constraint?: {
                fields?: string[];
            };
        };
    };
};


