import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Map, Plus, MessageCircle, User } from "lucide-react";

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items: { to: "/home" | "/map" | "/create" | "/chats" | "/profile"; label: string; icon: typeof Home; primary?: boolean }[] = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/map", label: "Map", icon: Map },
    { to: "/create", label: "Create", icon: Plus, primary: true },
    { to: "/chats", label: "Chats", icon: MessageCircle },
    { to: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl shadow-nav">
      <div className="mx-auto grid max-w-md grid-cols-5 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {items.map(({ to, label, icon: Icon, primary }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          if (primary) {
            return (
              <Link
                key={to}
                to={to}
                className="flex items-center justify-center"
                aria-label={label}
              >
                <span className="-mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition-transform active:scale-95">
                  <Icon className="h-7 w-7" strokeWidth={2.5} />
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
