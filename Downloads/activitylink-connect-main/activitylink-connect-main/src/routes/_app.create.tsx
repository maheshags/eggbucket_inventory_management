import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Calendar, MapPin, Users, ChevronDown, Check, Sparkles, Zap, Clock, Loader2 } from "lucide-react";
import { CATEGORIES } from "@/lib/mock-data";
import { doc, collection, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ReactDOMServer from "react-dom/server";

export const Route = createFileRoute("/_app/create")({
  component: Create,
});

const TEMPLATES = [
  { icon: "🤝", label: "Need a partner for…", prefix: "Need a partner for " },
  { icon: "💡", label: "Anyone interested in…", prefix: "Anyone interested in " },
  { icon: "👥", label: "Looking for people to…", prefix: "Looking for people to " },
  { icon: "☕", label: "Casual meetup for…", prefix: "Casual meetup for " },
];

function Create() {
  const navigate = useNavigate();
  const { dbUser } = useAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Other");
  const [catOpen, setCatOpen] = useState(false);
  const [autoApprove, setAutoApprove] = useState(true);
  const [max, setMax] = useState(10);
  const [unlimited, setUnlimited] = useState(false);
  const [when, setWhen] = useState<"now" | "scheduled">("now");
  const [radius, setRadius] = useState(5);
  const [hideExact, setHideExact] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locationName, setLocationName] = useState("Cubbon Park, Bengaluru");
  const [coords, setCoords] = useState<[number, number]>([12.9716, 77.5946]);
  const [showMap, setShowMap] = useState(false);

  const fetchLocationName = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data.address) {
        const name = data.address.amenity || data.address.park || data.address.road || data.address.suburb || data.address.city;
        if (name) setLocationName(name + (data.address.city ? `, ${data.address.city}` : ""));
      }
    } catch (e) {
      console.log("Reverse geocode failed", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dbUser) return;
    
    setIsSaving(true);
    try {
      const newDocRef = doc(collection(db, "activities"));
      await setDoc(newDocRef, {
        id: newDocRef.id,
        title: title.trim(),
        category,
        custom: true,
        autoApprove,
        maxParticipants: unlimited ? undefined : max,
        organizer: dbUser,
        participants: [dbUser], // Creator is the first participant
        when,
        distanceKm: 0.1, // Mock distance
        date: new Date(Date.now() + 3600000).toISOString(), // Mock date (1h from now)
        location: locationName,
        lat: coords[0],
        lng: coords[1],
        hideExact,
        createdAt: new Date().toISOString()
      });
      navigate({ to: "/home" });
    } catch (error) {
      console.error("Error creating activity:", error);
      alert("Failed to create activity. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const cat = CATEGORIES.find((c) => c.name === category);

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-lg">
        <Link to="/home" className="grid h-10 w-10 place-items-center rounded-full bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-extrabold leading-tight">Create activity</h1>
          <p className="text-[11px] text-muted-foreground">Give people a real reason to meet</p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 px-5 pt-5"
      >
        {/* Quick templates */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> Quick templates
            <span className="text-xs font-normal text-muted-foreground">· optional</span>
          </label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {TEMPLATES.map((t) => (
              <button
                key={t.prefix}
                type="button"
                onClick={() => setTitle(t.prefix)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:border-primary/40"
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        <Field label="Activity title" required>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sunset walk at lake, Chai near MG Road…"
            className="input"
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Write anything real — this is what makes your meetup unique.
          </p>
        </Field>

        <Field label="Category">
          <button
            type="button"
            onClick={() => setCatOpen(!catOpen)}
            className="input flex items-center justify-between"
          >
            <span className="flex items-center gap-2 font-semibold">
              <span className="text-xl">{cat?.icon}</span>
              {category}
            </span>
            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${catOpen ? "rotate-180" : ""}`} />
          </button>
          {catOpen && (
            <div className="mt-2 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-3 shadow-card animate-fade-in">
              {CATEGORIES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => { setCategory(c.name); setCatOpen(false); }}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2 text-xs font-semibold ${
                    category === c.name ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                >
                  <span className="text-2xl">{c.icon}</span>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field label="Description">
          <textarea rows={4} placeholder="Tell people why you're creating this. What to expect, what to bring, vibe…" className="input resize-none" />
        </Field>

        <Field label="Location">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative h-32 bg-[#e8eef3]">
              <MapContainer 
                center={coords} 
                zoom={14} 
                zoomControl={false} 
                className="h-full w-full"
                dragging={false}
                touchZoom={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <Marker position={coords} icon={L.divIcon({
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
                })} />
              </MapContainer>
            </div>
            <div className="flex items-center gap-2 border-t border-border px-4 py-3 text-sm">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <input 
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="font-medium bg-transparent outline-none flex-1 truncate" 
                placeholder="Name this location..."
              />
              <button type="button" onClick={() => setShowMap(true)} className="ml-auto shrink-0 text-xs font-semibold text-primary">Change</button>
            </div>
          </div>
        </Field>

        <Field label="When">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setWhen("now")}
              className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-bold transition-colors ${
                when === "now" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
              }`}
            >
              <Zap className="h-4 w-4" /> Now
            </button>
            <button
              type="button"
              onClick={() => setWhen("scheduled")}
              className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-bold transition-colors ${
                when === "scheduled" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
              }`}
            >
              <Clock className="h-4 w-4" /> Scheduled
            </button>
          </div>
          {when === "scheduled" && (
            <div className="mt-2 grid grid-cols-2 gap-2 animate-fade-in">
              <div className="input flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Sat, 28 Jun</span>
              </div>
              <div className="input flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">7:00 AM</span>
              </div>
            </div>
          )}
        </Field>

        <Field label={unlimited ? "Participants — unlimited" : `Participants — up to ${max}`}>
          <div className="flex items-center gap-3">
            <input
              type="range" min={2} max={30} value={max}
              disabled={unlimited}
              onChange={(e) => setMax(+e.target.value)}
              className="flex-1 accent-primary disabled:opacity-40"
            />
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} className="accent-primary" />
            No limit — anyone nearby can join
          </label>
        </Field>

        <Field label="Visibility radius">
          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 10, 25].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadius(r)}
                className={`rounded-2xl border py-3 text-sm font-bold transition-colors ${
                  radius === r ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </Field>

        <Field label="Join type">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAutoApprove(true)}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                autoApprove ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}
            >
              <p className="text-sm font-bold">Open join</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Anyone can join instantly</p>
            </button>
            <button
              type="button"
              onClick={() => setAutoApprove(false)}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                !autoApprove ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}
            >
              <p className="text-sm font-bold">Request approval</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">You approve each person</p>
            </button>
          </div>
        </Field>

        <button
          type="button"
          onClick={() => setHideExact(!hideExact)}
          className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4"
        >
          <div className="text-left">
            <p className="text-sm font-bold">Hide exact location</p>
            <p className="text-xs text-muted-foreground">Show approximate area until someone joins.</p>
          </div>
          <span className={`relative h-7 w-12 rounded-full transition-colors ${hideExact ? "bg-primary" : "bg-muted"}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-soft transition-transform ${hideExact ? "translate-x-6" : "translate-x-1"}`}>
              {hideExact && <Check className="m-auto mt-1 h-3 w-3 text-primary" strokeWidth={3} />}
            </span>
          </span>
        </button>

        <button
          type="submit"
          disabled={!title.trim() || isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-4 text-base font-bold text-primary-foreground shadow-glow transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Publish activity"}
        </button>
      </form>

      {/* Fullscreen Map Picker */}
      {showMap && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background animate-fade-in">
          <header className="flex items-center justify-between border-b border-border px-4 py-3 bg-background">
            <h2 className="text-lg font-bold">Pick a location</h2>
            <button onClick={() => setShowMap(false)} className="rounded-full bg-muted px-4 py-1.5 text-sm font-semibold">Done</button>
          </header>
          <div className="flex-1 relative">
            <MapContainer 
              center={coords} 
              zoom={15} 
              zoomControl={false} 
              className="h-full w-full"
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <LocationPickerEvents onSelect={(lat, lng) => {
                setCoords([lat, lng]);
                fetchLocationName(lat, lng);
              }} />
              <Marker position={coords} icon={L.divIcon({
                className: "custom-pin",
                html: ReactDOMServer.renderToString(
                  <div className="relative flex flex-col items-center animate-bounce-short">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground text-lg shadow-glow ring-4 ring-white">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="-mt-1 h-2.5 w-2.5 rotate-45 bg-primary" />
                  </div>
                ),
                iconSize: [40, 48],
                iconAnchor: [20, 48],
              })} />
            </MapContainer>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] rounded-full bg-foreground/90 px-4 py-2 text-xs font-semibold text-background shadow-soft backdrop-blur-sm">
              Tap anywhere on the map
            </div>
          </div>
        </div>
      )}

      <style>{`.input { width: 100%; border-radius: 1rem; border: 1px solid var(--border); background: var(--card); padding: 0.875rem 1rem; font-size: 0.95rem; outline: none; transition: all 0.15s; }
        .input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 20%, transparent); }`}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold">
        {label}
        {required && <span className="text-primary">*</span>}
      </label>
      {children}
    </div>
  );
}

function LocationPickerEvents({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}
