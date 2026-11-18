import { addDays, format } from "date-fns";
import type {
  AuditLifecycleStatus,
  AuditRecord,
  AuditSchedule,
  AuditScope,
  AuditStageProgress,
  AuditIssueItem,
  AuditConfigInput,
  VerificationStatus,
} from "@/lib/audit-types";
import { auditIssues } from "@/lib/mock-data";

export const AUDIT_STAGES = [
  "Discovering website pages",
  "Checking crawlability",
  "Analysing indexing",
  "Checking on-page SEO",
  "Checking internal links and redirects",
  "Validating structured data",
  "Checking performance and mobile experience",
  "Generating the audit report",
] as const;

export const DEFAULT_CHECKS = [
  { id: "crawlability", label: "Crawlability & HTTP status", description: "Robots.txt, canonical headers, redirect chains, 404 dead ends" },
  { id: "indexing", label: "Indexing & search coverage", description: "Search Console coverage flags, noindex directives, canonical parity" },
  { id: "onpage", label: "On-page SEO & content quality", description: "Title tags, meta descriptions, H1 hierarchy, thin content detection" },
  { id: "links", label: "Internal links & orphan pages", description: "Broken internal links, deep page discovery, non-descriptive anchor text" },
  { id: "structured_data", label: "Structured data & schema validation", description: "Product, Organization, BreadcrumbList JSON-LD syntax and missing fields" },
  { id: "performance", label: "Mobile experience & Core Web Vitals", description: "Largest Contentful Paint, viewport configuration, asset compression" },
];

function buildFixDetails(issue: (typeof auditIssues)[number]) {
  switch (issue.id) {
    case 3: // Sitemap contains non-indexable URLs
      return {
        targetType: "XML Sitemap Generator",
        previewBefore: "<url><loc>https://verdantbotanics.com/collections/sale</loc><changefreq>weekly</changefreq></url>\n<url><loc>https://verdantbotanics.com/store</loc><changefreq>daily</changefreq></url>",
        previewAfter: "<!-- Removed 7 redirecting/noindexed URLs -->\n<url><loc>https://verdantbotanics.com/collections/all</loc><changefreq>daily</changefreq></url>",
        explanation: "Regenerate sitemap to exclude 7 redirected or disallowed endpoints. Only canonical, HTTP 200 URLs will be included in sitemap.xml.",
        safeToApply: true,
      };
    case 5: // 4 published articles missing meta descriptions
      return {
        targetType: "WordPress CMS Metadata",
        previewBefore: "<meta name=\"description\" content=\"\" /> <!-- Empty tag -->",
        previewAfter: "<meta name=\"description\" content=\"Discover gentle, organic skincare routines crafted for sensitive skin with botanical extracts.\" />",
        explanation: "Inject curated, 140-character search-optimised meta descriptions generated from the approved content briefs for the 4 affected articles.",
        safeToApply: true,
      };
    case 7: // Duplicate title tags
      return {
        targetType: "Category Template Title Hook",
        previewBefore: "<title>Verdant Botanics — Products</title> (used across 6 pages)",
        previewAfter: "<title>Verdant Botanics — {Category Name} | Organic Skincare</title>",
        explanation: "Update title template pattern so category and archive pages automatically include specific collection names rather than generic company title.",
        safeToApply: true,
      };
    case 9: // Canonical points to a redirected URL
      return {
        targetType: "Canonical Tag Generator",
        previewBefore: "<link rel=\"canonical\" href=\"https://verdantbotanics.com/shop\" />",
        previewAfter: "<link rel=\"canonical\" href=\"https://verdantbotanics.com/collections/all\" />",
        explanation: "Rewrite canonical references to point directly to the destination HTTP 200 URL without following redirect chains.",
        safeToApply: true,
      };
    case 11: // Structured data error: Product missing offers
      return {
        targetType: "Schema.org JSON-LD Script",
        previewBefore: "\"@type\": \"Product\", \"name\": \"Rosehip Seed Oil\", ... (missing 'offers')",
        previewAfter: "\"@type\": \"Product\", \"name\": \"Rosehip Seed Oil\",\n\"offers\": { \"@type\": \"Offer\", \"price\": \"34.00\", \"priceCurrency\": \"USD\", \"availability\": \"https://schema.org/InStock\" }",
        explanation: "Populate Schema.org Offer node using live inventory data from your ecommerce database.",
        safeToApply: true,
      };
    default:
      return {
        targetType: issue.auto ? "Connected CMS & Template Engine" : "Server Configuration",
        previewBefore: "Current configuration without fix",
        previewAfter: "Updated settings applying: " + issue.fix,
        explanation: issue.fix,
        safeToApply: issue.auto,
      };
  }
}

function initializeAuditIssues(): AuditIssueItem[] {
  return auditIssues.map((issue) => {
    // Provide a realistic initial status: mostly open, 1 pending verification, 1 resolved in demo
    let verificationStatus: VerificationStatus = "open";
    let verificationNotes: string | undefined = undefined;
    let resolvedAt: string | undefined = undefined;
    let fixedAt: string | undefined = undefined;

    if (issue.id === 3) {
      verificationStatus = "pending_verification";
      fixedAt = new Date(Date.now() - 3600000 * 2).toISOString();
      verificationNotes = "Fix applied via CMS connector. Verification crawl scheduled.";
    } else if (issue.id === 8) {
      verificationStatus = "resolved";
      resolvedAt = new Date(Date.now() - 3600000 * 24).toISOString();
      verificationNotes = "Targeted recheck verified: Unique H1 tag confirmed present on all 3 URLs.";
    }

    return {
      ...issue,
      verificationStatus,
      verificationNotes,
      resolvedAt,
      fixedAt,
      fixDetails: buildFixDetails(issue),
    };
  });
}

function computeNextScheduled(schedule: AuditSchedule): string | undefined {
  if (schedule === "manual") return undefined;
  const now = new Date();
  if (schedule === "weekly") {
    // Next Monday at 02:00 UTC
    return format(addDays(now, 7), "yyyy-MM-dd'T'02:00:00'Z'");
  }
  // Monthly: 30 days from now
  return format(addDays(now, 30), "yyyy-MM-dd'T'02:00:00'Z'");
}

function computeIssueCounts(issues: AuditIssueItem[]) {
  const activeIssues = issues.filter((i) => i.verificationStatus !== "resolved");
  return {
    critical: activeIssues.filter((i) => i.severity === "Critical").length,
    high: activeIssues.filter((i) => i.severity === "High").length,
    medium: activeIssues.filter((i) => i.severity === "Medium").length,
    low: activeIssues.filter((i) => i.severity === "Low").length,
    total: activeIssues.length,
  };
}

// In-memory persistent state holder across server requests
interface AuditStateStore {
  currentAudit: AuditRecord | null;
  history: AuditRecord[];
  schedule: AuditSchedule;
  activeProgressTimer: NodeJS.Timeout | null;
}

const globalForAudit = globalThis as typeof globalThis & {
  __visibilityAuditStore?: AuditStateStore;
};

function getStore(): AuditStateStore {
  if (!globalForAudit.__visibilityAuditStore) {
    const issues = initializeAuditIssues();
    const issueCounts = computeIssueCounts(issues);
    const initialCompletedAudit: AuditRecord = {
      id: "audit_live_001",
      workspaceId: 1,
      websiteUrl: "https://verdantbotanics.com",
      status: "completed",
      startedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      completedAt: new Date(Date.now() - 3600000 * 3.8).toISOString(),
      scope: "full",
      selectedChecks: DEFAULT_CHECKS.map((c) => c.id),
      discoveredPages: 214,
      crawledPages: 214,
      currentStage: 7,
      stages: AUDIT_STAGES.map((s, idx) => ({
        stageIndex: idx,
        stageName: s,
        status: "completed",
        progressPct: 100,
        details: "Complete. Verified.",
      })),
      issues,
      issueCounts,
      resolvedSincePrevious: 4,
      newIssuesCount: 2,
      schedule: "weekly",
      nextScheduledAudit: computeNextScheduled("weekly"),
      isDemo: true,
    };

    // Historical records for Audit History comparison
    const history1: AuditRecord = {
      id: "audit_hist_002",
      workspaceId: 1,
      websiteUrl: "https://verdantbotanics.com",
      status: "completed",
      startedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 7 + 120000).toISOString(),
      scope: "full",
      selectedChecks: DEFAULT_CHECKS.map((c) => c.id),
      discoveredPages: 208,
      crawledPages: 208,
      currentStage: 7,
      stages: AUDIT_STAGES.map((s, idx) => ({
        stageIndex: idx,
        stageName: s,
        status: "completed",
        progressPct: 100,
      })),
      issues: issues.slice(0, 32),
      issueCounts: { critical: 4, high: 8, medium: 10, low: 11, total: 33 },
      resolvedSincePrevious: 2,
      newIssuesCount: 5,
      schedule: "weekly",
      isDemo: true,
    };

    const history2: AuditRecord = {
      id: "audit_hist_003",
      workspaceId: 1,
      websiteUrl: "https://verdantbotanics.com",
      status: "completed",
      startedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 14 + 115000).toISOString(),
      scope: "full",
      selectedChecks: DEFAULT_CHECKS.map((c) => c.id),
      discoveredPages: 198,
      crawledPages: 198,
      currentStage: 7,
      stages: AUDIT_STAGES.map((s, idx) => ({
        stageIndex: idx,
        stageName: s,
        status: "completed",
        progressPct: 100,
      })),
      issues: issues.slice(0, 35),
      issueCounts: { critical: 5, high: 9, medium: 12, low: 10, total: 36 },
      resolvedSincePrevious: 1,
      newIssuesCount: 8,
      schedule: "weekly",
      isDemo: true,
    };

    globalForAudit.__visibilityAuditStore = {
      currentAudit: initialCompletedAudit,
      history: [initialCompletedAudit, history1, history2],
      schedule: "weekly",
      activeProgressTimer: null,
    };
  }
  return globalForAudit.__visibilityAuditStore;
}

export function getCurrentAudit(): AuditRecord | null {
  const store = getStore();
  return store.currentAudit;
}

export function getAuditHistory(): AuditRecord[] {
  const store = getStore();
  return store.history;
}

export function getAuditSchedule(): AuditSchedule {
  const store = getStore();
  return store.schedule;
}

export function setAuditSchedule(schedule: AuditSchedule): AuditSchedule {
  const store = getStore();
  store.schedule = schedule;
  if (store.currentAudit) {
    store.currentAudit.schedule = schedule;
    store.currentAudit.nextScheduledAudit = computeNextScheduled(schedule);
  }
  return store.schedule;
}

export function setAuditLifecycleStatus(status: AuditLifecycleStatus): AuditRecord {
  const store = getStore();
  if (status === "not_audited") {
    store.currentAudit = null;
    return {
      id: "audit_none",
      workspaceId: 1,
      websiteUrl: "https://verdantbotanics.com",
      status: "not_audited",
      startedAt: new Date().toISOString(),
      scope: "full",
      selectedChecks: [],
      discoveredPages: 0,
      crawledPages: 0,
      currentStage: 0,
      stages: [],
      issues: [],
      issueCounts: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
      resolvedSincePrevious: 0,
      newIssuesCount: 0,
      schedule: store.schedule,
    };
  }

  if (status === "failed") {
    const failedAudit: AuditRecord = {
      id: `audit_failed_${Date.now()}`,
      workspaceId: 1,
      websiteUrl: "https://verdantbotanics.com",
      status: "failed",
      startedAt: new Date(Date.now() - 180000).toISOString(),
      completedAt: new Date().toISOString(),
      scope: "full",
      selectedChecks: DEFAULT_CHECKS.map((c) => c.id),
      discoveredPages: 42,
      crawledPages: 18,
      currentStage: 1,
      stages: AUDIT_STAGES.map((s, idx) => ({
        stageIndex: idx,
        stageName: s,
        status: idx === 0 ? "completed" : idx === 1 ? "failed" : "pending",
        progressPct: idx === 0 ? 100 : idx === 1 ? 40 : 0,
        details: idx === 1 ? "Host reset connection: robots.txt responded with HTTP 503." : undefined,
      })),
      issues: [],
      issueCounts: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
      resolvedSincePrevious: 0,
      newIssuesCount: 0,
      schedule: store.schedule,
      error: "Crawl halted: Origin server returned HTTP 503 Service Unavailable on /robots.txt after 3 retries.",
      isDemo: true,
    };
    store.currentAudit = failedAudit;
    return failedAudit;
  }

  if (status === "outdated") {
    const issues = initializeAuditIssues();
    const outdatedAudit: AuditRecord = {
      id: `audit_outdated_${Date.now()}`,
      workspaceId: 1,
      websiteUrl: "https://verdantbotanics.com",
      status: "outdated",
      startedAt: new Date(Date.now() - 86400000 * 45).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 45 + 120000).toISOString(),
      scope: "full",
      selectedChecks: DEFAULT_CHECKS.map((c) => c.id),
      discoveredPages: 184,
      crawledPages: 184,
      currentStage: 7,
      stages: AUDIT_STAGES.map((s, idx) => ({
        stageIndex: idx,
        stageName: s,
        status: "completed",
        progressPct: 100,
      })),
      issues,
      issueCounts: computeIssueCounts(issues),
      resolvedSincePrevious: 0,
      newIssuesCount: 6,
      schedule: store.schedule,
      nextScheduledAudit: computeNextScheduled(store.schedule),
      isDemo: true,
    };
    store.currentAudit = outdatedAudit;
    return outdatedAudit;
  }

  // default completed
  const issues = initializeAuditIssues();
  const completedAudit: AuditRecord = {
    id: `audit_completed_${Date.now()}`,
    workspaceId: 1,
    websiteUrl: "https://verdantbotanics.com",
    status: "completed",
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    completedAt: new Date(Date.now() - 7080000).toISOString(),
    scope: "full",
    selectedChecks: DEFAULT_CHECKS.map((c) => c.id),
    discoveredPages: 214,
    crawledPages: 214,
    currentStage: 7,
    stages: AUDIT_STAGES.map((s, idx) => ({
      stageIndex: idx,
      stageName: s,
      status: "completed",
      progressPct: 100,
    })),
    issues,
    issueCounts: computeIssueCounts(issues),
    resolvedSincePrevious: 4,
    newIssuesCount: 2,
    schedule: store.schedule,
    nextScheduledAudit: computeNextScheduled(store.schedule),
    isDemo: false,
  };
  store.currentAudit = completedAudit;
  return completedAudit;
}

/**
 * Starts a new audit with duplicate-run prevention.
 * If an audit is already running, returns the running one.
 */
export function startAudit(config: AuditConfigInput): AuditRecord {
  const store = getStore();

  // Duplicate-run prevention
  if (store.currentAudit && store.currentAudit.status === "in_progress") {
    return store.currentAudit;
  }

  const auditId = `audit_${Date.now()}`;
  const totalPages = config.scope === "custom" ? (config.customUrls?.length || 15) : config.scope === "changed" ? 48 : 214;

  const newAudit: AuditRecord = {
    id: auditId,
    workspaceId: 1,
    websiteUrl: "https://verdantbotanics.com",
    status: "in_progress",
    startedAt: new Date().toISOString(),
    scope: config.scope,
    customUrls: config.customUrls,
    selectedChecks: config.selectedChecks.length ? config.selectedChecks : DEFAULT_CHECKS.map((c) => c.id),
    discoveredPages: Math.min(24, totalPages),
    crawledPages: 0,
    currentStage: 0,
    stages: AUDIT_STAGES.map((name, idx) => ({
      stageIndex: idx,
      stageName: name,
      status: idx === 0 ? "running" : "pending",
      progressPct: idx === 0 ? 15 : 0,
      details: idx === 0 ? "Checking sitemap.xml and robots.txt..." : undefined,
    })),
    issues: [],
    issueCounts: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
    resolvedSincePrevious: 0,
    newIssuesCount: 0,
    schedule: store.schedule,
    nextScheduledAudit: computeNextScheduled(store.schedule),
    isDemo: false,
  };

  store.currentAudit = newAudit;

  // Run progress simulation across stages in backend
  simulateAuditProgress(newAudit, totalPages);

  return newAudit;
}

function simulateAuditProgress(audit: AuditRecord, totalPages: number) {
  const store = getStore();
  if (store.activeProgressTimer) {
    clearInterval(store.activeProgressTimer);
  }

  let step = 0;
  const maxSteps = 8; // 8 stages

  store.activeProgressTimer = setInterval(() => {
    if (!store.currentAudit || store.currentAudit.id !== audit.id || store.currentAudit.status !== "in_progress") {
      if (store.activeProgressTimer) clearInterval(store.activeProgressTimer);
      return;
    }

    step++;

    if (step < maxSteps) {
      const prevStage = step - 1;
      const currentStage = step;

      store.currentAudit.stages[prevStage].status = "completed";
      store.currentAudit.stages[prevStage].progressPct = 100;
      store.currentAudit.stages[prevStage].details = "Checked and analyzed.";

      store.currentAudit.stages[currentStage].status = "running";
      store.currentAudit.stages[currentStage].progressPct = Math.min(85, Math.round((step / maxSteps) * 100));

      store.currentAudit.currentStage = currentStage;
      store.currentAudit.discoveredPages = Math.min(totalPages, Math.round(totalPages * (0.3 + 0.7 * (step / maxSteps))));
      store.currentAudit.crawledPages = Math.min(totalPages, Math.round(totalPages * (step / maxSteps)));
    } else {
      // Completed!
      if (store.activeProgressTimer) clearInterval(store.activeProgressTimer);
      store.activeProgressTimer = null;

      const issues = initializeAuditIssues();
      const issueCounts = computeIssueCounts(issues);

      store.currentAudit.stages.forEach((s) => {
        s.status = "completed";
        s.progressPct = 100;
      });

      store.currentAudit.status = "completed";
      store.currentAudit.completedAt = new Date().toISOString();
      store.currentAudit.crawledPages = totalPages;
      store.currentAudit.discoveredPages = totalPages;
      store.currentAudit.currentStage = 7;
      store.currentAudit.issues = issues;
      store.currentAudit.issueCounts = issueCounts;
      store.currentAudit.resolvedSincePrevious = 4;
      store.currentAudit.newIssuesCount = 1;

      // Add to history
      store.history = [store.currentAudit, ...store.history.filter((h) => h.id !== store.currentAudit?.id)];
    }
  }, 1800); // Advances stage every 1.8 seconds for responsive feedback
}

/**
 * Apply automatic fix with user confirmation.
 * Moves issue to "pending_verification".
 */
export function applyIssueFix(issueId: number): AuditIssueItem | null {
  const store = getStore();
  if (!store.currentAudit) return null;

  const issue = store.currentAudit.issues.find((i) => i.id === issueId);
  if (!issue) return null;

  issue.verificationStatus = "pending_verification";
  issue.fixedAt = new Date().toISOString();
  issue.verificationNotes = "Fix applied via connected CMS. Targeted verification recheck queued.";

  // Update counts
  store.currentAudit.issueCounts = computeIssueCounts(store.currentAudit.issues);

  return issue;
}

/**
 * Targeted recheck for an issue.
 * Verifies whether the issue still exists on the affected URLs.
 */
export function verifyIssueFix(issueId: number, forceStillDetected = false): {
  success: boolean;
  issue: AuditIssueItem;
} {
  const store = getStore();
  if (!store.currentAudit) throw new Error("No active audit");

  const issue = store.currentAudit.issues.find((i) => i.id === issueId);
  if (!issue) throw new Error("Issue not found");

  issue.lastCheckedAt = new Date().toISOString();

  // If forceStillDetected or based on issue state:
  if (forceStillDetected) {
    issue.verificationStatus = "still_detected";
    issue.verificationNotes = `Targeted recheck failed: Issue still detected on ${issue.urls[0]}. The tag or server directive has not been updated yet.`;
    store.currentAudit.issueCounts = computeIssueCounts(store.currentAudit.issues);
    return { success: false, issue };
  }

  // Successful resolution
  issue.verificationStatus = "resolved";
  issue.resolvedAt = new Date().toISOString();
  issue.verificationNotes = `Targeted recheck verified: Successfully resolved across all ${issue.urls.length} affected URL(s).`;

  store.currentAudit.resolvedSincePrevious += 1;
  store.currentAudit.issueCounts = computeIssueCounts(store.currentAudit.issues);

  return { success: true, issue };
}

