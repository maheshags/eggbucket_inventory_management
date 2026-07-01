import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, Camera, Check, Loader2 } from "lucide-react";
import { CATEGORIES, RADIUS_OPTIONS } from "@/lib/mock-data";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const { user, dbUser, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && dbUser) {
      navigate({ to: "/home" });
    }
  }, [dbUser, loading, navigate]);
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [radius, setRadius] = useState(5);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      if (!user) {
        alert("Authentication error. Please log in again.");
        navigate({ to: "/auth" });
        return;
      }
      setIsSaving(true);
      try {
        await setDoc(doc(db, "users", user.uid), {
          id: user.uid,
          name: name.trim(),
          age: parseInt(age, 10),
          avatar: "https://i.pravatar.cc/200?u=" + user.uid,
          rating: 5.0,
          verified: false,
          interests,
          radius,
          createdAt: new Date().toISOString()
        });
        navigate({ to: "/home" });
      } catch (error: any) {
        console.error("Error saving profile:", error);
        alert(`Failed to save profile: ${error.message || "Unknown error"}. Check console.`);
        setIsSaving(false);
      }
    }
  };

  const canNext =
    (step === 0 && interests.length > 0) ||
    (step === 1 && radius > 0) ||
    (step === 2 && name.trim().length > 1 && age.trim().length > 0 && !isSaving);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="px-6 pb-2 pt-10">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Step {step + 1} of 3
        </p>
      </header>

      <div className="flex-1 px-6 pb-32 pt-2">
        {step === 0 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-extrabold leading-tight">What are you into?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Pick at least one. We'll show activities matching your vibe.</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {CATEGORIES.map((c) => {
                const selected = interests.includes(c.name);
                return (
                  <button
                    key={c.name}
                    onClick={() =>
                      setInterests((p) => selected ? p.filter((x) => x !== c.name) : [...p, c.name])
                    }
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition-all ${
                      selected
                        ? "border-primary bg-primary/5 shadow-soft"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    {selected && (
                      <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                    <span className="text-2xl">{c.icon}</span>
                    <span className="mt-1 text-xs font-semibold">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-extrabold leading-tight">How far will you go?</h2>
            <p className="mt-2 text-sm text-muted-foreground">We'll show activities within this radius.</p>
            <div className="mt-8 space-y-3">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all ${
                    radius === r
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-border bg-card"
                  }`}
                >
                  <div>
                    <p className="text-lg font-bold">{r} km</p>
                    <p className="text-xs text-muted-foreground">
                      {r === 1 ? "Walking distance" : r === 5 ? "Short ride" : r === 10 ? "Across the neighborhood" : "Citywide"}
                    </p>
                  </div>
                  <div className={`grid h-6 w-6 place-items-center rounded-full border-2 ${
                    radius === r ? "border-primary bg-primary" : "border-border"
                  }`}>
                    {radius === r && <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-extrabold leading-tight">Set up your profile</h2>
            <p className="mt-2 text-sm text-muted-foreground">This is what others will see.</p>

            <div className="mt-8 flex justify-center">
              <button className="group relative">
                <div className="grid h-28 w-28 place-items-center rounded-full bg-gradient-warm text-muted-foreground">
                  <Camera className="h-8 w-8" />
                </div>
                <div className="absolute -bottom-1 right-0 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow">
                  <Camera className="h-4 w-4" />
                </div>
              </button>
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Age</label>
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  type="number"
                  placeholder="25"
                  className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/80 px-6 py-4 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="rounded-2xl border border-border bg-card px-6 py-3.5 text-sm font-semibold"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canNext || isSaving}
            className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3.5 text-base font-semibold text-primary-foreground shadow-glow transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : step === 2 ? (
              "Finish"
            ) : (
              "Continue"
            )}
            {!isSaving && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
