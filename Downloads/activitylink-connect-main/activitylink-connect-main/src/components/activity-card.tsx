import { Link } from "@tanstack/react-router";
import { Users, Clock, MapPin, Sparkles, BadgeCheck } from "lucide-react";
import type { Activity } from "@/lib/mock-data";
import { CATEGORIES } from "@/lib/mock-data";

export function ActivityCard({ activity, variant = "default" }: { activity: Activity; variant?: "default" | "compact" }) {
  const cat = CATEGORIES.find((c) => c.name === activity.category)!;
  const date = new Date(activity.date);
  const timeStr = date.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
  const firstName = activity.organizer.name.split(" ")[0];

  if (variant === "compact") {
    return (
      <Link
        to="/activity/$id"
        params={{ id: activity.id }}
        className="block w-64 shrink-0 overflow-hidden rounded-2xl bg-card shadow-card transition-transform active:scale-[0.98]"
      >
        <div className="relative h-32 overflow-hidden bg-muted">
          {activity.image && (
            <img src={activity.image} alt={activity.title} className="h-full w-full object-cover" loading="lazy" />
          )}
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold backdrop-blur">
            <span>{cat.icon}</span> {activity.category}
          </div>
          {activity.custom && (
            <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground shadow-glow">
              <Sparkles className="h-3 w-3" strokeWidth={2.5} /> Custom
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="line-clamp-1 text-sm font-bold">{activity.title}</h3>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
            by {firstName}{activity.organizer.verified && <BadgeCheck className="ml-0.5 inline h-3 w-3 fill-primary text-primary-foreground" />}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{activity.distanceKm} km</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{activity.participants.length}/{activity.maxParticipants}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/activity/$id"
      params={{ id: activity.id }}
      className="block overflow-hidden rounded-3xl bg-card shadow-card transition-transform active:scale-[0.99]"
    >
      <div className="relative h-40 overflow-hidden bg-muted">
        {activity.image && (
          <img src={activity.image} alt={activity.title} className="h-full w-full object-cover" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-bold backdrop-blur">
            <span>{cat.icon}</span> {activity.category}
          </div>
          {activity.custom && (
            <div className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground shadow-glow">
              <Sparkles className="h-3 w-3" strokeWidth={2.5} /> Custom
            </div>
          )}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
          <div className="flex items-center gap-1 text-xs font-semibold">
            <MapPin className="h-3.5 w-3.5" />
            <span>{activity.distanceKm} km away</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-base font-bold leading-snug">{activity.title}</h3>
        <div className="mt-1 flex items-center gap-1.5">
          <img src={activity.organizer.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{firstName}</span>
            {activity.organizer.verified && <BadgeCheck className="ml-0.5 inline h-3 w-3 fill-primary text-primary-foreground" />}
            <span className="mx-1">·</span>{activity.location}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{timeStr}</span>
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{activity.participants.length}/{activity.maxParticipants}</span>
          </div>
          <span className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-soft">
            {activity.joined ? "Joined" : "Join"}
          </span>
        </div>
      </div>
    </Link>
  );
}
