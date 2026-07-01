import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save, Loader2, User, Hash, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { dbUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(dbUser?.name || "");
  const [age, setAge] = useState(dbUser?.age?.toString() || "");
  const [radius, setRadius] = useState(dbUser?.radius?.toString() || "5");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!dbUser) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", dbUser.id), {
        name: name.trim(),
        age: parseInt(age, 10) || dbUser.age,
        radius: parseInt(radius, 10) || dbUser.radius,
      });
      navigate({ to: "/profile" });
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!dbUser) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate({ to: "/profile" })} className="grid h-10 w-10 place-items-center rounded-full bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </header>

      <div className="px-5 py-6 space-y-6">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Personal Info</label>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="flex-1 bg-transparent text-sm font-semibold outline-none"
              />
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <Hash className="h-5 w-5 text-muted-foreground" />
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age"
                className="flex-1 bg-transparent text-sm font-semibold outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Discovery</label>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-semibold">Search radius (km)</span>
              </div>
              <span className="text-sm font-bold text-primary">{radius} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="mt-4 w-full accent-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
