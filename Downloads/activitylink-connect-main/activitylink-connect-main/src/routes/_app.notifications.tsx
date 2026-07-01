import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Check, X, Sparkles, Calendar } from "lucide-react";
import { NOTIFICATIONS } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/notifications")({
  component: Notifications,
});

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return "just now";
  if (diff < 60) return `${Math.floor(diff)}m ago`;
  if (diff < 60 * 24) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / (60 * 24))}d ago`;
}

function Notifications() {
  return (
    <div>
      <header className="bg-gradient-warm px-5 pb-5 pt-12">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-card shadow-soft">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Notifications</h1>
            <p className="text-xs text-muted-foreground">{NOTIFICATIONS.length} updates</p>
          </div>
        </div>
      </header>

      <div className="space-y-3 px-5 pt-5">
        {NOTIFICATIONS.map((n) => (
          <div key={n.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft animate-fade-in">
            {n.type === "join_request" && n.user && n.activity && (
              <div className="flex items-start gap-3">
                <img src={n.user.avatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-bold">{n.user.name}</span> wants to join{" "}
                    <Link to="/activity/$id" params={{ id: n.activity.id }} className="font-bold text-primary">
                      {n.activity.title}
                    </Link>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.at)}</p>
                  <div className="mt-3 flex gap-2">
                    <button className="flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground">
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button className="flex items-center gap-1 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-bold">
                      <X className="h-3.5 w-3.5" /> Decline
                    </button>
                  </div>
                </div>
              </div>
            )}

            {n.type === "update" && n.activity && (
              <Link to="/activity/$id" params={{ id: n.activity.id }} className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent/20 text-accent-foreground">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.at)}</p>
                </div>
              </Link>
            )}

            {n.type === "low_participants" && n.activity && (
              <div>
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.at)}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-muted/60 p-3">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Similar activities nearby</p>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {["💪 Gym push", "🏃 5K run", "🏋️ HIIT class"].map((t) => (
                      <span key={t} className="shrink-0 rounded-full bg-card px-3 py-1.5 text-xs font-semibold shadow-soft">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {n.type === "recommendation" && (
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.at)}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
