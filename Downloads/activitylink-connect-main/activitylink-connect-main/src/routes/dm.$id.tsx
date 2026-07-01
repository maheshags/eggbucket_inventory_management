import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Info, Smile, MoreVertical, Ban } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/dm/$id")({
  component: DirectMessage,
});

function DirectMessage() {
  const { id } = useParams({ from: "/dm/$id" });
  const { dbUser } = useAuth();
  const [connection, setConnection] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch connection details
    const unsubscribe = onSnapshot(doc(db, "connections", id), (docSnap) => {
      if (docSnap.exists()) {
        setConnection({ id: docSnap.id, ...docSnap.data() });
      }
    });

    // Listen to messages
    const q = query(collection(db, "connections", id, "messages"), orderBy("at", "asc"));
    const unsubMsgs = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
    });

    return () => {
      unsubscribe();
      unsubMsgs();
    };
  }, [id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  if (!connection || !dbUser) return <div className="p-6">Loading chat...</div>;

  const otherUserId = connection.users.find((uId: string) => uId !== dbUser.id);
  const otherUser = connection.usersMap[otherUserId];

  const send = async () => {
    if (!text.trim()) return;
    const messageText = text.trim();
    setText("");
    try {
      await addDoc(collection(db, "connections", id, "messages"), {
        user: {
          id: dbUser.id,
          name: dbUser.name,
          avatar: dbUser.avatar || "https://i.pravatar.cc/150"
        },
        text: messageText,
        at: new Date().toISOString()
      });
    } catch (e) {
      alert("Error sending message.");
    }
  };

  const blockUser = async () => {
    if (confirm(`Are you sure you want to block ${otherUser.name}?`)) {
      await updateDoc(doc(db, "connections", id), {
        status: "blocked",
        blockedBy: dbUser.id
      });
      setShowMenu(false);
    }
  };

  const isBlocked = connection.status === "blocked";

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <header className="shrink-0 flex items-center gap-3 border-b border-border bg-background px-4 py-3 z-10">
        <button onClick={() => window.history.back()} className="grid h-10 w-10 place-items-center rounded-full bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="relative">
            <img src={otherUser.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
            {!isBlocked && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-background" />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{otherUser.name}</p>
            <p className="text-xs text-muted-foreground">{isBlocked ? "Blocked" : "Connected"}</p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="grid h-10 w-10 place-items-center rounded-full bg-muted">
            <MoreVertical className="h-5 w-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card p-1 shadow-glow z-50 animate-fade-in">
              <button 
                onClick={blockUser}
                disabled={isBlocked}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-destructive active:bg-muted disabled:opacity-50"
              >
                <Ban className="h-4 w-4" />
                {isBlocked ? "User Blocked" : "Block User"}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4" onClick={() => setShowMenu(false)}>
        <div className="mx-auto my-2 w-fit rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">
          Direct messaging is end-to-end encrypted
        </div>

        <div className="space-y-2">
          {messages.map((m, i) => {
            const mine = m.user.id === dbUser?.id;
            const prev = messages[i - 1];
            const showAvatar = !mine && (!prev || prev.user.id !== m.user.id);
            return (
              <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && (
                  showAvatar
                    ? <img src={m.user.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                    : <div className="w-7" />
                )}
                <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm shadow-soft ${
                      mine
                        ? "rounded-br-md bg-gradient-primary text-primary-foreground"
                        : "rounded-bl-md bg-card text-foreground"
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="mt-0.5 px-1 text-[10px] text-muted-foreground">
                    {new Date(m.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-border bg-background px-3 py-3">
        {isBlocked ? (
          <div className="py-2 text-center text-sm font-bold text-muted-foreground">
            You cannot reply to this conversation.
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-1 rounded-full bg-muted px-4 py-2.5">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Message"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button className="text-muted-foreground"><Smile className="h-5 w-5" /></button>
            </div>
            <button
              onClick={send}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow active:scale-95"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
