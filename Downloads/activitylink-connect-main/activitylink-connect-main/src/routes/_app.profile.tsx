import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Settings, Star, Shield, ChevronRight, LogOut, MapPin, Calendar, Camera, Pencil, Check, Loader2 } from "lucide-react";
import { CATEGORIES, type Activity } from "@/lib/mock-data";
import { ActivityCard } from "@/components/activity-card";
import { useAuth } from "@/lib/auth-context";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";

export const Route = createFileRoute("/_app/profile")({
  component: Profile,
});

function Profile() {
  const { dbUser } = useAuth();
  const navigate = useNavigate();
  const [myActivities, setMyActivities] = useState<Activity[]>([]);
  const [hostedActivities, setHostedActivities] = useState<Activity[]>([]);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dbUser) return;

    // Fetch all activities user joined or hosted
    const unsubActivities = onSnapshot(collection(db, "activities"), (snapshot) => {
      const all = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Activity));
      const joined = all.filter(a =>
        a.participants?.some(p => p.id === dbUser.id)
      );
      const hosted = all.filter(a => a.organizer?.id === dbUser.id);
      setMyActivities(joined);
      setHostedActivities(hosted);
    });

    // Fetch connections count
    const q = query(collection(db, "connections"), where("users", "array-contains", dbUser.id));
    const unsubConnections = onSnapshot(q, (snapshot) => {
      const connected = snapshot.docs.filter(d => d.data().status === "connected");
      setConnectionsCount(connected.length);
    });

    return () => {
      unsubActivities();
      unsubConnections();
    };
  }, [dbUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate({ to: "/" });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !dbUser) return;
    setSavingAvatar(true);
    try {
      // Compress and convert to base64 data URL
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise(resolve => { img.onload = resolve; });
      canvas.width = 200;
      canvas.height = 200;
      ctx.drawImage(img, 0, 0, 200, 200);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      await updateDoc(doc(db, "users", dbUser.id), { avatar: dataUrl });
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      alert("Failed to update profile picture.");
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleSaveBio = async () => {
    if (!dbUser) return;
    setSavingBio(true);
    try {
      await updateDoc(doc(db, "users", dbUser.id), { bio: bioText.trim() });
      setEditingBio(false);
    } catch (error) {
      alert("Failed to save bio.");
    } finally {
      setSavingBio(false);
    }
  };

  if (!dbUser) return <div className="p-6">Loading profile...</div>;

  // Get user interests from their onboarding data
  const interests: string[] = (dbUser as any).interests || [];

  return (
    <div className="pb-8">
      <header className="relative bg-gradient-hero px-5 pb-16 pt-12 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Profile</h1>
        </div>
      </header>

      <div className="-mt-12 px-5">
        <div className="rounded-3xl bg-card p-5 shadow-card animate-fade-in">
          <div className="flex items-end gap-4">
            <div className="relative -mt-12">
              <img src={dbUser.avatar || "https://i.pravatar.cc/150"} alt="" className="h-24 w-24 rounded-full object-cover ring-4 ring-card" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={savingAvatar}
                className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow ring-2 ring-card active:scale-90 transition-transform disabled:opacity-60"
              >
                {savingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="flex-1 pb-1">
              <h2 className="text-xl font-extrabold">{dbUser.name}{dbUser.age ? `, ${dbUser.age}` : ""}</h2>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="font-bold text-foreground">{dbUser.rating || "5.0"}</span>
                <span>· {dbUser.verified ? "Verified" : "New member"}</span>
              </p>
            </div>
          </div>

          {editingBio ? (
            <div className="mt-3 flex items-start gap-2">
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Write something about yourself..."
                rows={2}
                maxLength={150}
                className="flex-1 rounded-xl border border-border bg-muted px-3 py-2 text-sm outline-none focus:border-primary resize-none"
              />
              <button
                onClick={handleSaveBio}
                disabled={savingBio}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow active:scale-90 disabled:opacity-60"
              >
                {savingBio ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />}
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setBioText(dbUser.bio || ""); setEditingBio(true); }}
              className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground active:text-primary transition-colors"
            >
              <span>{dbUser.bio || "No bio yet. Tap to add one!"}</span>
              <Pencil className="h-3.5 w-3.5 text-primary" />
            </button>
          )}

          <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-2xl bg-muted/60 py-3 text-center">
            <Stat n={myActivities.length} label="Joined" />
            <Stat n={hostedActivities.length} label="Hosted" />
            <Stat n={connectionsCount} label="Friends" />
          </div>
        </div>

        <Section title="Interests">
          {interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {interests.map((i) => {
                const cat = CATEGORIES.find((c) => c.name === i);
                return (
                  <span key={i} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold shadow-soft">
                    <span>{cat?.icon}</span> {i}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No interests selected yet.</p>
          )}
        </Section>

        <Section title="Activity history">
          {myActivities.length > 0 ? (
            <div className="space-y-3">
              {myActivities.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
                  {a.image && <img src={a.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{a.title}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {a.location || "Unknown"}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" /> {a.date ? new Date(a.date).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }) : "—"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                    {a.organizer?.id === dbUser.id ? "Hosted" : "Joined"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">No activities yet. Join one from the home screen!</p>
            </div>
          )}
        </Section>

        <Section title="Account">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <Row to="/privacy" icon={<Shield className="h-5 w-5 text-accent-foreground" />} label="Privacy & safety" />
            <Row to="/settings" icon={<Settings className="h-5 w-5 text-muted-foreground" />} label="Settings" />
            <button onClick={handleLogout} className="flex w-full items-center gap-3 border-t border-border px-4 py-3.5 text-destructive">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-muted"><LogOut className="h-5 w-5" /></span>
              <span className="flex-1 text-left text-sm font-semibold">Log out</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <p className="text-lg font-extrabold">{n}</p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Row({ icon, label, destructive, to }: { icon: React.ReactNode; label: string; destructive?: boolean; to?: string }) {
  const content = (
    <>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-muted">{icon}</span>
      <span className="flex-1 text-left text-sm font-semibold">{label}</span>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </>
  );

  const className = `flex w-full items-center gap-3 border-b border-border px-4 py-3.5 last:border-0 ${destructive ? "text-destructive" : ""}`;

  if (to) {
    return <Link to={to} className={className}>{content}</Link>;
  }

  return (
    <button className={className}>
      {content}
    </button>
  );
}
