import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Sparkles, Plus, Bell } from "lucide-react";
import { CATEGORIES, Activity } from "@/lib/mock-data";
import { ActivityCard } from "@/components/activity-card";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/_app/home")({
  component: Home,
});

function Home() {
  const { dbUser } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "activities"), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Activity));
      setActivities(fetched);
    });
    return () => unsubscribe();
  }, []);

  const filteredActivities = activities.filter(a => {
    const matchesCategory = !selectedCategory || a.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      a.title?.toLowerCase().includes(q) || 
      a.location?.toLowerCase().includes(q) || 
      a.category?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const custom = filteredActivities.filter((a) => a.custom).sort((a, b) => a.distanceKm - b.distanceKm);
  const nearby = [...filteredActivities].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 6);
  const recommended = filteredActivities.filter((a) => !a.custom && dbUser?.interests?.includes(a.category));
  const trending = [...filteredActivities].sort((a, b) => b.participants.length - a.participants.length).slice(0, 5);

  return (
    <div>
      <header className="bg-gradient-warm px-5 pb-6 pt-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={dbUser?.avatar || "https://i.pravatar.cc/150"} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-card" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Good evening 👋</p>
              <p className="text-base font-bold">Hey, {dbUser?.name || "there"}!</p>
            </div>
          </div>
          <Link to="/notifications" className="relative grid h-11 w-11 place-items-center rounded-full bg-card shadow-soft">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
          </Link>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-card px-4 py-3.5 shadow-soft">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities, places…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <Link
          to="/create"
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3.5 text-sm font-bold text-primary-foreground shadow-glow active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          Create your own activity
        </Link>
      </header>

      <div className="px-5 pt-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedCategory === null ? "bg-primary border-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"
            }`}
          >
            🔥 All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelectedCategory(c.name)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                selectedCategory === c.name ? "bg-primary border-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span>{c.icon}</span> {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Custom activities — highest priority */}
      <Section
        title="Custom Activities Near You"
        subtitle="Real people. Real reasons to meet."
        icon={<Sparkles className="h-4 w-4 text-primary" />}
      >
        <div className="flex gap-3 overflow-x-auto px-5 no-scrollbar pb-2">
          {custom.map((a) => <ActivityCard key={a.id} activity={a} variant="compact" />)}
        </div>
      </Section>

      <Section title="Nearby Activities" subtitle="Within your radius">
        <div className="flex gap-3 overflow-x-auto px-5 no-scrollbar pb-2">
          {nearby.map((a) => <ActivityCard key={a.id} activity={a} variant="compact" />)}
        </div>
      </Section>

      <Section title="Recommended for you" icon={<Sparkles className="h-4 w-4 text-primary" />}>
        <div className="space-y-4 px-5">
          {recommended.map((a) => <ActivityCard key={a.id} activity={a} />)}
        </div>
      </Section>

      <Section title="Trending now" subtitle="Most joined this week">
        <div className="flex gap-3 overflow-x-auto px-5 no-scrollbar pb-2">
          {trending.map((a) => <ActivityCard key={a.id} activity={a} variant="compact" />)}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <div className="flex items-end justify-between px-5 pb-3">
        <div>
          <h2 className="flex items-center gap-1.5 text-lg font-extrabold">{icon}{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <Link to="/map" className="text-xs font-semibold text-primary">See all</Link>
      </div>
      {children}
    </section>
  );
}
