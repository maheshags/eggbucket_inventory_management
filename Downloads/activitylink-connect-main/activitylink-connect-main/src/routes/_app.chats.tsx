import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Lock, Sparkles, BadgeCheck, MessageCircle, Users } from "lucide-react";
import { CONNECTIONS, type Activity } from "@/lib/mock-data";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/chats")({
  component: Chats,
});

function Chats() {
  const [tab, setTab] = useState<"groups" | "direct">("groups");
  const { dbUser } = useAuth();
  const [myActivities, setMyActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dbUser) return;
    const unsubscribe = onSnapshot(collection(db, "activities"), (snapshot) => {
      const allActivities = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Activity));
      // Filter activities where user is organizer OR is in participants array
      const joined = allActivities.filter(a => 
        a.organizer?.id === dbUser.id || 
        a.participants?.some(p => p.id === dbUser.id)
      );
      setMyActivities(joined);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [dbUser]);

  const [dbConnections, setDbConnections] = useState<any[]>([]);
  useEffect(() => {
    if (!dbUser) return;
    // Firebase query for where users array contains my ID
    const q = query(collection(db, "connections"), where("users", "array-contains", dbUser.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDbConnections(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [dbUser]);

  const acceptConnection = async (id: string) => {
    try {
      await updateDoc(doc(db, "connections", id), { status: "connected", updatedAt: serverTimestamp() });
    } catch (e) {
      alert("Failed to accept connection");
    }
  };

  const pending = dbConnections.filter((c) => c.status === "pending" && c.receiver === dbUser?.id);
  const connected = dbConnections.filter((c) => c.status === "connected");

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="bg-gradient-warm px-5 pb-4 pt-12">
        <h1 className="text-2xl font-extrabold">Chats</h1>
        <p className="text-xs text-muted-foreground">Talk inside activities. DM only with connections.</p>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-card p-1 shadow-soft">
          <button
            onClick={() => setTab("groups")}
            className={`rounded-xl py-2.5 text-sm font-bold transition-all ${
              tab === "groups" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground"
            }`}
          >
            <Users className="mr-1 inline h-4 w-4" /> Activity chats
          </button>
          <button
            onClick={() => setTab("direct")}
            className={`rounded-xl py-2.5 text-sm font-bold transition-all ${
              tab === "direct" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground"
            }`}
          >
            <MessageCircle className="mr-1 inline h-4 w-4" /> Connections
          </button>
        </div>
      </header>

      {tab === "groups" ? (
          <div className="px-5 pt-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Activities you've joined</p>
          {loading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">Loading chats...</div>
          ) : myActivities.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border p-4 text-center">
              <Lock className="mx-auto h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-xs font-semibold">Join more activities to unlock chats</p>
              <Link to="/home" className="mt-2 inline-block text-xs font-bold text-primary">Explore activities →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {myActivities.map((a) => (
                <Link
                  key={a.id}
                  to="/chat/$id"
                  params={{ id: a.id }}
                  className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft active:scale-[0.99]"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-muted">
                    {a.image && <img src={a.image} alt="" className="h-full w-full object-cover" />}
                    {a.custom && (
                      <span className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow">
                        <Sparkles className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold">{a.title}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-muted-foreground">Tap to view chat...</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      ) : (
        <div className="px-5 pt-4">
          {pending.length > 0 && (
            <>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Requests · {pending.length}
              </p>
              <div className="mb-5 space-y-2">
                {pending.map((c) => {
                  const otherUser = c.usersMap[c.initiator];
                  return (
                  <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
                    <img src={otherUser.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 text-sm font-bold">
                        {otherUser.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Wants to connect and chat
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold">Decline</button>
                      <button onClick={() => acceptConnection(c.id)} className="rounded-full bg-gradient-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-glow">Accept</button>
                    </div>
                  </div>
                )})}
              </div>
            </>
          )}

          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Connected</p>
          <div className="space-y-2">
            {connected.length === 0 && (
              <div className="py-4 text-center text-sm text-muted-foreground">No connections yet.</div>
            )}
            {connected.map((c) => {
              const otherUserId = c.users.find((id: string) => id !== dbUser?.id);
              const otherUser = c.usersMap[otherUserId];
              return (
              <Link
                key={c.id}
                to="/dm/$id"
                params={{ id: c.id }}
                className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 shadow-soft active:scale-[0.99]"
              >
                <img src={otherUser.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                <div className="min-w-0 flex-1 text-left">
                  <p className="flex items-center gap-1 text-sm font-bold">
                    {otherUser.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">Tap to chat...</p>
                </div>
              </Link>
            )})}
          </div>

          <div className="mt-6 rounded-2xl bg-primary/5 p-4">
            <Lock className="h-4 w-4 text-primary" />
            <p className="mt-1.5 text-xs font-bold">Private chat is trust-gated</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              You can DM someone only after you've both connected — usually after sharing a real activity.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
