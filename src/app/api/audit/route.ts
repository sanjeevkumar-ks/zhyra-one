import { NextResponse } from "next/server";
import {
  getCurrentAudit,
  getAuditHistory,
  getAuditSchedule,
  setAuditSchedule,
  startAudit,
  applyIssueFix,
  verifyIssueFix,
  setAuditLifecycleStatus,
} from "@/lib/services/audit-service";
import type { AuditConfigInput, AuditLifecycleStatus, AuditSchedule } from "@/lib/audit-types";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentAudit = getCurrentAudit();
  const history = getAuditHistory();
  const schedule = getAuditSchedule();
  const isRunning = currentAudit?.status === "in_progress";

  return NextResponse.json({
    currentAudit,
    history,
    schedule,
    isRunning,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === "start") {
      const config: AuditConfigInput = {
        scope: body.scope || "full",
        customUrls: body.customUrls,
        selectedChecks: body.selectedChecks || [],
      };
      const audit = startAudit(config);
      return NextResponse.json({ success: true, audit });
    }

    if (action === "fix") {
      const issueId = Number(body.issueId);
      const issue = applyIssueFix(issueId);
      return NextResponse.json({ success: !!issue, issue });
    }

    if (action === "verify") {
      const issueId = Number(body.issueId);
      const forceStillDetected = Boolean(body.forceStillDetected);
      const res = verifyIssueFix(issueId, forceStillDetected);
      return NextResponse.json({ success: res.success, issue: res.issue });
    }

    if (action === "schedule") {
      const schedule = body.schedule as AuditSchedule;
      const updated = setAuditSchedule(schedule);
      return NextResponse.json({ success: true, schedule: updated });
    }

    if (action === "reset") {
      const status = body.status as AuditLifecycleStatus;
      const audit = setAuditLifecycleStatus(status);
      return NextResponse.json({ success: true, audit });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

