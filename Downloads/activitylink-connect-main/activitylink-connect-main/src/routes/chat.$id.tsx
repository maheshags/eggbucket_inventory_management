import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Info, Smile } from "lucide-react";
import { getActivity, type Message } from "@/lib/mock-data";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/chat/$id")({
  component: Chat,
});

function Chat() {
  const { id } = useParams({ from: "/chat/$id" });
  const { dbUser } = useAuth();
  const [activity, setActivity] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // Fetch activity details
    getDoc(doc(db, "activities", id)).then((docSnap) => {
      if (docSnap.exists()) setActivity(docSnap.data());
    });

    // Listen to messages
    const q = query(collection(db, "activities", id, "messages"), orderBy("at", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Fetched messages:", snapshot.docs.length);
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
    }, (error) => {
      console.error("Error listening to messages:", error);
      alert("Error listening to messages: " + error.message);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  if (!activity) return <div className="p-6">Loading chat...</div>;

  const send = async () => {
    console.log("Send button clicked. Text:", text, "dbUser:", dbUser);
    if (!text.trim()) return;
    if (!dbUser) {
      alert("Error: You are not fully logged in or your profile is missing! dbUser is null.");
      return;
    }
    const messageText = text.trim();
    setText("");
    try {
      await addDoc(collection(db, "activities", id, "messages"), {
        user: {
          id: dbUser.id,
          name: dbUser.name,
          avatar: dbUser.avatar || "https://i.pravatar.cc/150"
        },
        text: messageText,
        at: new Date().toISOString()
      });
      console.log("Message sent successfully!");
    } catch (e) {
      console.error("Failed to send message", e);
      alert("Error sending message: " + (e as Error).message);
    }
  };

  const requestConnection = async (targetUser: any) => {
    if (!dbUser) return;
    setConnecting(true);
    try {
      // Create a unique connection ID based on both users
      const connectionId = [dbUser.id, targetUser.id].sort().join("_");
      await setDoc(doc(db, "connections", connectionId), {
        users: [dbUser.id, targetUser.id],
        initiator: dbUser.id,
        receiver: targetUser.id,
        status: "pending",
        updatedAt: serverTimestamp(),
        usersMap: {
          [dbUser.id]: { id: dbUser.id, name: dbUser.name, avatar: dbUser.avatar || "https://i.pravatar.cc/150" },
          [targetUser.id]: { id: targetUser.id, name: targetUser.name, avatar: targetUser.avatar || "https://i.pravatar.cc/150" }
        }
      });
      alert("Connection request sent!");
      setSelectedUser(null);
    } catch (e) {
      console.error(e);
      alert("Failed to send request.");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <header className="shrink-0 flex items-center gap-3 border-b border-border bg-background px-4 py-3 z-10">
        <button onClick={() => window.history.back()} className="grid h-10 w-10 place-items-center rounded-full bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <div className="relative">
            <img src={activity.organizer.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-background" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{activity.title}</p>
            <p className="text-xs text-muted-foreground">{activity.participants?.length || 0} members</p>
          </div>
        </div>
        <Link to="/activity/$id" params={{ id: activity.id }} className="grid h-10 w-10 place-items-center rounded-full bg-muted">
          <Info className="h-5 w-5" />
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto my-2 w-fit rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">
          Chat unlocked · You joined this activity
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
                    ? <button onClick={() => setSelectedUser(m.user)} className="active:scale-95 transition-transform"><img src={m.user.avatar} alt="" className="h-7 w-7 rounded-full object-cover" /></button>
                    : <div className="w-7" />
                )}
                <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  {!mine && showAvatar && (
                    <span onClick={() => setSelectedUser(m.user)} className="mb-0.5 ml-1 text-[11px] font-semibold text-muted-foreground active:text-primary cursor-pointer">{m.user.name}</span>
                  )}
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
          <div className="mx-auto my-2 w-fit rounded-full bg-accent/20 px-3 py-1 text-[11px] font-semibold text-accent-foreground">
            Activity starts in 2 hours · don't forget to check in
          </div>
        </div>
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-border bg-background px-3 py-3">
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
      </div>

      {/* User Profile Sheet */}
      {selectedUser && (
        <div className="absolute inset-0 z-50 flex flex-col bg-black/40 animate-fade-in" onClick={() => setSelectedUser(null)}>
          <div className="mt-auto rounded-t-3xl bg-background px-5 pb-8 pt-3 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="mx-auto h-1.5 w-12 rounded-full bg-border" />
            <div className="mt-6 flex flex-col items-center text-center">
              <img src={selectedUser.avatar} alt="" className="h-20 w-20 rounded-full object-cover shadow-soft" />
              <h2 className="mt-3 text-xl font-extrabold">{selectedUser.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Joined this activity</p>
            </div>
            <button
              disabled={connecting}
              onClick={() => requestConnection(selectedUser)}
              className="mt-6 w-full rounded-2xl bg-gradient-primary py-3.5 text-base font-semibold text-primary-foreground shadow-glow active:scale-[0.98] disabled:opacity-70"
            >
              {connecting ? "Sending Request..." : "Request to Connect"}
            </button>
            <p className="mt-4 text-center text-[11px] text-muted-foreground px-4">
              You must connect before you can send direct messages. They will be notified of your request.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
