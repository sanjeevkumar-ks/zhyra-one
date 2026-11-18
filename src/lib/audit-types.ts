export type AuditLifecycleStatus =
  | "not_audited"
  | "in_progress"
  | "completed"
  | "failed"
  | "outdated";

export type AuditSchedule = "weekly" | "monthly" | "manual";

export type AuditScope = "full" | "changed" | "custom";

export type IssueSeverity = "Critical" | "High" | "Medium" | "Low";

export type VerificationStatus =
  | "open"
  | "fixing"
  | "pending_verification"
  | "resolved"
  | "still_detected";

export interface FixDetails {
  targetType: string;
  previewBefore: string;
  previewAfter: string;
  explanation: string;
  safeToApply: boolean;
}

export interface AuditIssueItem {
  id: number;
  severity: IssueSeverity;
  title: string;
  what: string;
  why: string;
  fix: string;
  auto: boolean;
  urls: string[];
  verificationStatus: VerificationStatus;
  lastCheckedAt?: string;
  verificationNotes?: string;
  fixedAt?: string;
  resolvedAt?: string;
  fixDetails?: FixDetails;
}

export interface AuditStageProgress {
  stageIndex: number;
  stageName: string;
  status: "pending" | "running" | "completed" | "failed";
  progressPct: number;
  details?: string;
}

export interface AuditRecord {
  id: string;
  workspaceId: number;
  websiteUrl: string;
  status: AuditLifecycleStatus;
  startedAt: string;
  completedAt?: string;
  scope: AuditScope;
  customUrls?: string[];
  selectedChecks: string[];
  discoveredPages: number;
  crawledPages: number;
  currentStage: number; // 0..7
  stages: AuditStageProgress[];
  issues: AuditIssueItem[];
  issueCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  resolvedSincePrevious: number;
  newIssuesCount: number;
  nextScheduledAudit?: string;
  schedule: AuditSchedule;
  error?: string;
  isDemo?: boolean;
}

export interface AuditConfigInput {
  scope: AuditScope;
  customUrls?: string[];
  selectedChecks: string[];
}

