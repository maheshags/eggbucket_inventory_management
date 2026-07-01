import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Share2, MapPin, Clock, Users, Star, MessageCircle, Lock, Check, Sparkles, BadgeCheck, Flag, EyeOff, UserPlus, X } from "lucide-react";
import { CATEGORIES, Activity } from "@/lib/mock-data";
import { doc, onSnapshot, updateDoc, arrayUnion, setDoc, serverTimestamp, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Plus } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ReactDOMServer from "react-dom/server";

export const Route = createFileRoute("/activity/$id")({
  component: ActivityDetail,
  notFoundComponent: () => <div className="p-6">Activity not found.</div>,
});

function ActivityDetail() {
  const { id } = useParams({ from: "/activity/$id" });
  const navigate = useNavigate();
  const { dbUser } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [selectedFull, setSelectedFull] = useState<any>(null);
  const [selectedActivitiesCount, setSelectedActivitiesCount] = useState<number>(0);

  useEffect(() => {
    if (!selectedParticipant) {
      setSelectedFull(null);
      setSelectedActivitiesCount(0);
      return;
    }

    // Fetch full user doc
    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", selectedParticipant.id));
        if (userDoc.exists()) {
          setSelectedFull(userDoc.data());
        }
        
        // Count activities joined
        const q = query(collection(db, "activities"));
        const snap = await getDocs(q);
        let count = 0;
        snap.forEach(d => {
          const act = d.data();
          if (act.participants?.some((p: any) => p.id === selectedParticipant.id)) count++;
        });
        setSelectedActivitiesCount(count);
      } catch (e) {
        console.error("Failed to fetch participant details", e);
      }
    };
    fetchUser();
  }, [selectedParticipant]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "activities", id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as Activity;
        setActivity(data);
        setJoined(data.participants.some(p => p.id === dbUser?.id));
      } else {
        setActivity(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id, dbUser?.id]);

  const handleJoin = async () => {
    if (!dbUser || !activity) return;
    setIsJoining(true);
    try {
      const activityRef = doc(db, "activities", activity.id);
      await updateDoc(activityRef, {
        participants: arrayUnion({
          id: dbUser.id,
          name: dbUser.name,
          avatar: dbUser.avatar || "https://i.pravatar.cc/150"
        })
      });
    } catch (error) {
      console.error("Error joining activity:", error);
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!activity) return <div className="p-6">Activity not found.</div>;
  const cat = CATEGORIES.find((c) => c.name === activity.category) || CATEGORIES[0];
  const date = new Date(activity.date);

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="relative h-72">
        {activity.image && (
          <img src={activity.image} alt={activity.title} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-12">
          <Link to="/home" className="grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <button className="grid h-10 w-10 place-items-center rounded-full bg-background/90 backdrop-blur">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="-mt-12 px-5">
        <div className="rounded-3xl bg-card p-5 shadow-card animate-fade-in">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <span>{cat.icon}</span> {activity.category}
            </span>
            {activity.custom && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-glow">
                <Sparkles className="h-3 w-3" strokeWidth={2.5} /> Custom activity
              </span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-extrabold leading-tight">{activity.title}</h1>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Info icon={<MapPin className="h-4 w-4" />} label={`${activity.distanceKm} km`} sub="Away" />
            <Info icon={<Clock className="h-4 w-4" />} label={date.toLocaleDateString([], { weekday: "short", day: "numeric" })} sub={date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} />
            <Info icon={<Users className="h-4 w-4" />} label={`${activity.participants.length}/${activity.maxParticipants}`} sub="Joined" />
          </div>
        </div>

        <Section title={activity.custom ? "Created by" : "Organizer"}>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <img src={activity.organizer?.avatar || "https://i.pravatar.cc/150"} alt="" className="h-14 w-14 rounded-full object-cover" />
              <div className="flex-1">
                <p className="flex items-center gap-1 font-bold">
                  {activity.organizer?.name || "Unknown"}
                  {activity.organizer?.verified && <BadgeCheck className="h-4 w-4 fill-primary text-primary-foreground" />}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  <span className="font-semibold text-foreground">{activity.organizer?.rating || "5.0"}</span>
                  <span>· {activity.custom ? "Community host" : "Host"}</span>
                </p>
              </div>
              <button className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                <UserPlus className="h-3.5 w-3.5" /> Connect
              </button>
            </div>
            {activity.custom && (
              <div className="mt-3 rounded-xl bg-primary/5 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary">Why they created this</p>
                <p className="text-sm leading-relaxed">{activity.description}</p>
              </div>
            )}
          </div>
        </Section>

        {!activity.custom && (
          <Section title="About">
            <p className="text-sm leading-relaxed text-muted-foreground">{activity.description}</p>
          </Section>
        )}

        <Section title="Location">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative h-36">
              <MapContainer
                center={[activity.lat || 12.9716, activity.lng || 77.5946]}
                zoom={15}
                zoomControl={false}
                dragging={false}
                touchZoom={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                className="h-full w-full"
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <Marker
                  position={[activity.lat || 12.9716, activity.lng || 77.5946]}
                  icon={L.divIcon({
                    className: "custom-pin",
                    html: ReactDOMServer.renderToString(
                      <div className="relative flex flex-col items-center">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground text-lg shadow-glow ring-4 ring-white">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div className="-mt-1 h-2.5 w-2.5 rotate-45 bg-primary" />
                      </div>
                    ),
                    iconSize: [40, 48],
                    iconAnchor: [20, 48],
                  })}
                />
              </MapContainer>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${activity.lat || 12.9716},${activity.lng || 77.5946}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border-t border-border px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold">{activity.location || "View on map"}</p>
                <p className="text-xs text-muted-foreground">Tap to open in Google Maps</p>
              </div>
            </a>
          </div>
        </Section>

        <Section title={`Participants (${activity.participants.length})`}>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {activity.participants.map((p) => (
              <LiveParticipantButton 
                key={p.id} 
                userId={p.id} 
                fallbackName={p.name} 
                fallbackAvatar={p.avatar}
                onClick={() => setSelectedParticipant(p)} 
              />
            ))}
            {Array.from({ length: Math.max(0, activity.maxParticipants - activity.participants.length) }).slice(0, 3).map((_, i) => (
              <div key={i} className="flex w-16 shrink-0 flex-col items-center text-center">
                <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-border text-muted-foreground">
                  <Users className="h-5 w-5" />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Open</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Safety">
          <div className="space-y-2">
            <button className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-muted"><EyeOff className="h-4 w-4" /></div>
              <div className="flex-1">
                <p className="text-sm font-bold">Hide exact location</p>
                <p className="text-[11px] text-muted-foreground">Reveal precise spot only to joined members</p>
              </div>
            </button>
            <button className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-destructive/10 text-destructive"><Flag className="h-4 w-4" /></div>
              <div className="flex-1">
                <p className="text-sm font-bold">Report activity or host</p>
                <p className="text-[11px] text-muted-foreground">Something feels off? Let us know.</p>
              </div>
            </button>
          </div>
        </Section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-5 py-4 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md items-center gap-3">
          {joined ? (
            <button
              onClick={() => navigate({ to: "/chat/$id", params: { id: activity.id } })}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3.5 text-base font-bold text-primary-foreground shadow-glow"
            >
              <MessageCircle className="h-5 w-5" /> Open chat
            </button>
          ) : (
            <>
              <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3.5 text-sm font-semibold text-muted-foreground">
                <Lock className="h-4 w-4" /> Chat unlocks after joining
              </div>
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="flex items-center gap-2 rounded-2xl bg-gradient-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-glow active:scale-[0.98] disabled:opacity-50"
              >
                <Check className="h-5 w-5" /> {isJoining ? "Joining..." : "Join"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Participant Profile Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setSelectedParticipant(null)}>
          <div 
            className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl mb-8 slide-in-from-bottom-8 animate-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <img src={selectedParticipant.avatar || "https://i.pravatar.cc/150"} alt="" className="h-20 w-20 rounded-full object-cover ring-4 ring-card shadow-soft" />
              <button 
                onClick={() => setSelectedParticipant(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <h3 className="mt-4 text-xl font-extrabold">{selectedParticipant.name} {selectedFull?.age ? `, ${selectedFull.age}` : ""}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span className="font-bold text-foreground">{selectedFull?.rating || "5.0"}</span>
              <span>· {selectedActivitiesCount} activities joined</span>
            </p>

            {selectedFull?.bio && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                "{selectedFull.bio}"
              </p>
            )}

            {selectedFull?.interests && selectedFull.interests.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedFull.interests.map((interest: string) => {
                  const cat = CATEGORIES.find(c => c.name === interest);
                  return (
                    <span key={interest} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                      {cat?.icon} {interest}
                    </span>
                  );
                })}
              </div>
            )}
            
            {joined && selectedParticipant.id !== dbUser?.id ? (
              <button
                onClick={async () => {
                  if (!dbUser) return;
                  const connectionId = [dbUser.id, selectedParticipant.id].sort().join("_");
                  try {
                    await setDoc(doc(db, "connections", connectionId), {
                      users: [dbUser.id, selectedParticipant.id],
                      initiator: dbUser.id,
                      receiver: selectedParticipant.id,
                      status: "pending",
                      updatedAt: serverTimestamp(),
                      usersMap: {
                        [dbUser.id]: { id: dbUser.id, name: dbUser.name, avatar: dbUser.avatar || "https://i.pravatar.cc/150" },
                        [selectedParticipant.id]: { id: selectedParticipant.id, name: selectedParticipant.name, avatar: selectedParticipant.avatar || "https://i.pravatar.cc/150" }
                      }
                    });
                    alert(`Connection request sent to ${selectedParticipant.name}!`);
                    setSelectedParticipant(null);
                  } catch (e) {
                    alert("Failed to send request.");
                  }
                }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3.5 text-base font-bold text-primary-foreground shadow-glow active:scale-[0.98]"
              >
                <UserPlus className="h-5 w-5" /> Connect with {selectedParticipant.name.split(' ')[0]}
              </button>
            ) : selectedParticipant.id === dbUser?.id ? (
              <p className="mt-4 text-sm font-semibold text-muted-foreground text-center bg-muted py-3 rounded-2xl">This is you!</p>
            ) : (
              <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3.5 text-sm font-semibold text-muted-foreground">
                <Lock className="h-4 w-4" /> Join activity to connect
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LiveParticipantButton({ userId, fallbackName, fallbackAvatar, onClick }: { userId: string, fallbackName: string, fallbackAvatar: string, onClick: () => void }) {
  const [liveUser, setLiveUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", userId), (doc) => {
      if (doc.exists()) setLiveUser(doc.data());
    });
    return () => unsub();
  }, [userId]);

  const name = liveUser?.name || fallbackName;
  const avatar = liveUser?.avatar || fallbackAvatar || "https://i.pravatar.cc/150";

  return (
    <button 
      onClick={onClick}
      className="flex w-16 shrink-0 flex-col items-center text-center active:scale-95 transition-transform"
    >
      <img src={avatar} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-card" />
      <p className="mt-1 line-clamp-1 text-[11px] font-semibold">{name.split(" ")[0]}</p>
    </button>
  );
}

function Info({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 py-3">
      <div className="mx-auto mb-1 grid h-7 w-7 place-items-center rounded-full bg-card text-primary">{icon}</div>
      <p className="text-sm font-bold">{label}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
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
