"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Field, Modal, toast } from "@/components/ui-client";
import { FilterSelect } from "@/components/filters";
import { SettingsSection } from "@/components/settings/settings-ui";
import { Check, Mail, Minus, Trash2, UserPlus } from "lucide-react";

interface TeamMember {
  name: string;
  email: string;
  role: "Owner" | "Editor" | "Reviewer" | "Viewer";
  status?: "Active" | "Pending";
  lastActive?: string;
}

const EXTENDED_MEMBERS: TeamMember[] = [
  { name: "Elena Rostova", email: "elena@verdantbotanics.com", role: "Owner", status: "Active", lastActive: "Just now" },
  { name: "Marcus Chen", email: "marcus@verdantbotanics.com", role: "Editor", status: "Active", lastActive: "2 hours ago" },
  { name: "Sarah Jenkins", email: "sarah@verdantbotanics.com", role: "Reviewer", status: "Active", lastActive: "Yesterday" },
  { name: "David Kim", email: "david.kim@agency.co", role: "Viewer", status: "Active", lastActive: "3 days ago" },
];

const PERMISSIONS = [
  { feature: "Manage billing & subscription", owner: true, editor: false, reviewer: false, viewer: false },
  { feature: "Workspace settings & domain config", owner: true, editor: false, reviewer: false, viewer: false },
  { feature: "Configure brand knowledge & guardrails", owner: true, editor: true, reviewer: false, viewer: false },
  { feature: "Create & draft content briefs", owner: true, editor: true, reviewer: false, viewer: false },
  { feature: "Approve content in review stage", owner: true, editor: false, reviewer: true, viewer: false },
  { feature: "Publish & schedule to connected CMS", owner: true, editor: true, reviewer: true, viewer: false },
  { feature: "View performance analytics & rankings", owner: true, editor: true, reviewer: true, viewer: true },
  { feature: "Manage API keys & webhooks", owner: true, editor: false, reviewer: false, viewer: false },
];

const ROLES = ["Owner", "Editor", "Reviewer", "Viewer"] as const;
const ROLE_OPTIONS = ROLES.map((r) => ({ value: r as string, label: r as string }));
const INVITE_ROLE_OPTIONS = [
  { value: "Editor", label: "Editor — can create, edit, and publish content" },
  { value: "Reviewer", label: "Reviewer — can review and approve content" },
  { value: "Viewer", label: "Viewer — read-only access to reports & analytics" },
  { value: "Owner", label: "Owner — full workspace & billing administration" },
];

const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line";
const GRID = "grid grid-cols-[minmax(0,1fr)_repeat(4,3.5rem)] items-center gap-x-1 sm:grid-cols-[minmax(0,1fr)_repeat(4,5rem)]";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function StatusChip({ status }: { status?: TeamMember["status"] }) {
  const pending = status === "Pending";
  return (
    <span
      className={cx(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium",
        pending ? "bg-warning-bg text-warning-fg" : "bg-success-bg text-success-fg"
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", pending ? "bg-warning" : "bg-success")} aria-hidden />
      {pending ? "Pending" : "Active"}
    </span>
  );
}

function Allowed({ yes, label }: { yes: boolean; label: string }) {
  return (
    <span className="flex justify-center">
      {yes ? (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success-bg text-success-fg">
          <Check size={12} strokeWidth={2.5} aria-hidden />
          <span className="sr-only">{label}: allowed</span>
        </span>
      ) : (
        <span className="inline-flex h-5 w-5 items-center justify-center text-faint">
          <Minus size={14} strokeWidth={2} aria-hidden />
          <span className="sr-only">{label}: not allowed</span>
        </span>
      )}
    </span>
  );
}

export function MembersSettings() {
  const [members, setMembers] = useState<TeamMember[]>(EXTENDED_MEMBERS);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMember["role"]>("Editor");

  const ownerCount = members.filter((x) => x.role === "Owner").length;
  const pendingCount = members.filter((x) => x.status === "Pending").length;

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast("Please enter a valid email address");
      return;
    }
    const nameFromEmail = inviteEmail.split("@")[0].replace(".", " ");
    const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

    setMembers([
      ...members,
      {
        name: formattedName,
        email: inviteEmail,
        role: inviteRole,
        status: "Pending",
        lastActive: "Invited today",
      },
    ]);
    setShowInviteModal(false);
    setInviteEmail("");
    toast(`Invitation sent to ${inviteEmail}`);
  };

  const handleRoleChange = (email: string, newRole: TeamMember["role"]) => {
    setMembers(
      members.map((m) => (m.email === email ? { ...m, role: newRole } : m))
    );
    toast(`Role updated to ${newRole}`);
  };

  const handleRemoveMember = (email: string) => {
    if (members.length <= 1) {
      toast("Workspace must retain at least one Owner");
      return;
    }
    setMembers(members.filter((m) => m.email !== email));
    toast("Team member removed");
  };

  return (
    <div className="space-y-6">
      {/* Members */}
      <SettingsSection
        title="Team members & roles"
        description="Manage your organization collaborators and fine-tune editorial permissions."
        action={
          <Button size="sm" className="gap-1.5" onClick={() => setShowInviteModal(true)}>
            <UserPlus size={14} strokeWidth={1.75} className="shrink-0" />
            Invite member
          </Button>
        }
        footer={
          <span className="text-xs tabular-nums text-muted">
            {plural(members.length, "member")}
            {pendingCount > 0 && ` · ${pendingCount} pending`}
          </span>
        }
      >
        <ul className="divide-y divide-line">
          {members.map((m) => {
            const initials = m.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            const lockOwner = m.role === "Owner" && ownerCount === 1;

            return (
              <li
                key={m.email}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3.5 sm:px-5"
              >
                <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-sunken text-xs font-semibold"
                    aria-hidden
                  >
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">{m.name}</p>
                    <p className="truncate text-xs text-muted">{m.email}</p>
                    <p className="mt-0.5 text-xs text-muted sm:hidden">{m.lastActive || "Recently"}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <FilterSelect
                    size="sm"
                    className="w-32"
                    label={`Role for ${m.name}`}
                    value={m.role}
                    onChange={(v) => handleRoleChange(m.email, v as TeamMember["role"])}
                    options={ROLE_OPTIONS}
                  />
                  <StatusChip status={m.status} />
                  <span className="hidden w-24 text-xs text-muted sm:block">{m.lastActive || "Recently"}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.email)}
                    title={lockOwner ? "The only Owner can't be removed" : "Remove member"}
                    aria-label={`Remove ${m.name}`}
                    disabled={lockOwner}
                    className={cx(
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-sunken hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted",
                      ring
                    )}
                  >
                    <Trash2 size={15} strokeWidth={1.75} className="shrink-0" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </SettingsSection>

      {/* Permission matrix */}
      <SettingsSection
        title="Role permission matrix"
        description="Default permission scopes across governance, editorial workflows, and data visibility."
      >
        <div className="divide-y divide-line">
          <div className={cx(GRID, "bg-subtle px-4 py-2.5 text-[11px] font-medium text-muted sm:px-5 sm:text-xs")}>
            <span>Capability</span>
            {ROLES.map((r) => (
              <span key={r} className="text-center">{r}</span>
            ))}
          </div>
          {PERMISSIONS.map((perm) => (
            <div key={perm.feature} className={cx(GRID, "px-4 py-3 sm:px-5")}>
              <span className="pr-2 text-[13px] font-medium">{perm.feature}</span>
              <Allowed yes={perm.owner} label="Owner" />
              <Allowed yes={perm.editor} label="Editor" />
              <Allowed yes={perm.reviewer} label="Reviewer" />
              <Allowed yes={perm.viewer} label="Viewer" />
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Invite Member Modal */}
      <Modal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite team member"
        description="Invite a colleague to collaborate on content, review articles, or manage settings."
        width={480}
        footer={
          <div className="flex w-full items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="invite-member-form">
              Send invitation
            </Button>
          </div>
        }
      >
        <form id="invite-member-form" onSubmit={handleSendInvite} className="space-y-4">
          <Field label="Work email" hint="An invitation email with access link will be sent">
            <div className="relative">
              <Mail
                size={16}
                strokeWidth={1.75}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                type="email"
                className="field !pl-10"
                placeholder="colleague@verdantbotanics.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </Field>

          <Field label="Role & access scope">
            <FilterSelect
              label="Role and access scope"
              value={inviteRole}
              onChange={(v) => setInviteRole(v as TeamMember["role"])}
              options={INVITE_ROLE_OPTIONS}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}