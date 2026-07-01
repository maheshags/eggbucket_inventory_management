import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Shield, EyeOff, Ban, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export const Route = createFileRoute("/_app/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const { dbUser } = useAuth();
  const navigate = useNavigate();
  // Assume a default false if not set
  const [hideLocation, setHideLocation] = useState(dbUser?.hideLocation || false);

  const toggleLocation = async () => {
    if (!dbUser) return;
    const newValue = !hideLocation;
    setHideLocation(newValue);
    try {
      await updateDoc(doc(db, "users", dbUser.id), {
        hideLocation: newValue
      });
    } catch (error) {
      console.error("Failed to update privacy settings:", error);
      // Revert if failed
      setHideLocation(!newValue);
    }
  };

  if (!dbUser) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ to: "/profile" })} className="grid h-10 w-10 place-items-center rounded-full bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Privacy & safety</h1>
        </div>
      </header>

      <div className="px-5 py-6 space-y-6">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Activity Privacy</label>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <EyeOff className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Hide exact location</p>
                  <p className="text-[11px] text-muted-foreground">Apply by default to new activities</p>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" checked={hideLocation} onChange={toggleLocation} />
                <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Interactions</label>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <button className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-muted">
                <Ban className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold">Blocked users</p>
                <p className="text-[11px] text-muted-foreground">Manage people you've blocked</p>
              </div>
            </button>
            <button className="flex w-full items-center gap-3 px-4 py-3.5">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-destructive">Report an issue</p>
                <p className="text-[11px] text-muted-foreground">Contact support about a safety concern</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
