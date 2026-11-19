import Link from "next/link";
import { getCurrentUser } from "@/lib/api/data";
import { cn, initials } from "@/lib/utils";
import type { Role } from "@/lib/types";

const roleLabel: Record<Role, string> = { super_admin: "Super admin", admin: "Admin", coach: "Coach", student: "Student" };

/** Avatar + name. Pass `href` to make it a link (the student portal links it to My profile). */
export async function UserChip({ compact = false, dark = false, href }: { compact?: boolean; dark?: boolean; href?: string }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const body = (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-bean-600 text-xs font-semibold text-white">
        {initials(user.name)}
      </span>
      {!compact && (
        <span className="min-w-0 text-sm leading-tight">
          <span className={cn("flex items-center gap-1.5 truncate font-medium", dark ? "text-white" : "text-fg")}>
            <span className="truncate">{user.name}</span>
            {user.role !== "student" && (
              <span className={cn("shrink-0 rounded px-1 py-px text-[9px] font-semibold", dark ? "bg-bean-600/30 text-bean-200" : "bg-bean-50 text-bean-700")}>
                {roleLabel[user.role]}
              </span>
            )}
          </span>
          <span className={cn("block truncate text-xs", dark ? "text-white/45" : "text-fg-muted")}>{user.email ?? user.phone}</span>
        </span>
      )}
    </>
  );
  const cls = "flex min-w-0 items-center gap-3";
  return href ? (
    <Link href={href} aria-label={user.name} className={cn(cls, "rounded-xl transition-opacity hover:opacity-80")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function UserChipSkeleton({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  const bone = dark ? "bg-white/10" : "bg-surface-2";
  return (
    <div className="flex items-center gap-3">
      <span className={cn("size-9 animate-pulse rounded-xl", bone)} />
      {!compact && (
        <span className="space-y-1.5">
          <span className={cn("block h-3 w-24 animate-pulse rounded", bone)} />
          <span className={cn("block h-2.5 w-32 animate-pulse rounded", bone)} />
        </span>
      )}
    </div>
  );
}

/** Shown in the student portal only for team accounts. */
export async function AdminSwitch({ compact = false }: { compact?: boolean }) {
  const user = await getCurrentUser();
  if (!user || user.role === "student") return null;
  if (compact)
    return (
      <a href="/admin" className="inline-flex h-10 items-center rounded-xl bg-ink-900 px-3 text-xs font-semibold text-white">
        Admin
      </a>
    );
  return (
    <a href="/admin" className="mb-3 flex items-center justify-between rounded-2xl bg-ink-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-ink-700">
      Admin console
      <span className="rounded-md bg-bean-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase">{roleLabel[user.role]}</span>
    </a>
  );
}
