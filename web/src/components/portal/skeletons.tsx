import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-surface-2", className)}>
      <div className="absolute inset-0 animate-shimmer shimmer-bg" />
    </div>
  );
}

export function PortalSkeleton({ variant }: { variant: "dashboard" | "list" | "learn" }) {
  if (variant === "dashboard")
    return (
      <div className="space-y-6" aria-busy>
        <Bone className="h-12 w-72" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Bone className="h-72 rounded-2xl lg:col-span-2" />
          <Bone className="h-72 rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <Bone key={i} className="h-36 rounded-2xl" />)}
        </div>
      </div>
    );
  return (
    <div className="space-y-4" aria-busy>
      <Bone className="h-12 w-64" />
      <Bone className="h-12 w-full max-w-xl" />
      {Array.from({ length: 5 }, (_, i) => <Bone key={i} className="h-24" />)}
    </div>
  );
}
