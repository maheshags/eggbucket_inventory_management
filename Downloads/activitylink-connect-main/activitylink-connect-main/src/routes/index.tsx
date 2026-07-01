import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MapPin } from "lucide-react";

import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const { user, dbUser, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (user) {
        if (dbUser) navigate({ to: "/home" });
        else navigate({ to: "/onboarding" });
      } else {
        navigate({ to: "/auth" });
      }
    }, 1800);
    return () => clearTimeout(t);
  }, [navigate, user, dbUser, loading]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-hero text-white">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute left-10 top-20 h-40 w-40 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute right-10 top-1/3 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-20 left-1/3 h-48 w-48 rounded-full bg-white/25 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center animate-fade-in">
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-pulse-ring rounded-3xl bg-white/40" />
          <div className="relative grid h-20 w-20 place-items-center rounded-3xl bg-white text-primary shadow-glow">
            <MapPin className="h-10 w-10" strokeWidth={2.5} />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">ActivityLink</h1>
        <p className="mt-3 max-w-xs text-center text-sm font-medium text-white/90">
          Connect through real activities near you
        </p>

        <div className="mt-12 flex gap-1.5">
          <span className="h-2 w-2 animate-bounce-soft rounded-full bg-white" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 animate-bounce-soft rounded-full bg-white" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 animate-bounce-soft rounded-full bg-white" style={{ animationDelay: "300ms" }} />
        </div>
      </div>

      <div className="absolute bottom-8 text-xs text-white/70">v1.0 · MVP Preview</div>
    </div>
  );
}
