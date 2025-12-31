import { PlanInterface } from "@/types/common";

export const PLANS: PlanInterface = {
  FREE: {
    maxUsers: 10,
    maxProjects: 3,
    maxTasksPerProject: 50,

    aiRequestsPerDay: 5,
    aiEnabled: true,

    auditLogRetentionDays: 7,
    commentsEnabled: true,

    canInviteUsers: true,
    canExportData: false,
    canAccessAuditLogs: false
  },

  PRO: {
    maxUsers: 20,
    maxProjects: 50,
    maxTasksPerProject: 500,

    aiRequestsPerDay: 100,
    aiEnabled: true,

    auditLogRetentionDays: 90,
    commentsEnabled: true,

    canInviteUsers: true,
    canExportData: true,
    canAccessAuditLogs: true
  },

  ENTERPRISE: {
    maxUsers: Infinity,
    maxProjects: Infinity,
    maxTasksPerProject: Infinity,

    aiRequestsPerDay: 1000,
    aiEnabled: true,

    auditLogRetentionDays: 365,
    commentsEnabled: true,

    canInviteUsers: true,
    canExportData: true,
    canAccessAuditLogs: true
  }
};
