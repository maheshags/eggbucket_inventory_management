import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Filter, List, X, MapPin } from "lucide-react";
import { CATEGORIES, Activity } from "@/lib/mock-data";
import { ActivityCard } from "@/components/activity-card";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ReactDOMServer from "react-dom/server";

export const Route = createFileRoute("/_app/map")({
  component: MapExplore,
});

function MapExplore() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sheet, setSheet] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapRef, setMapRef] = useState<L.Map | null>(null);

  useEffect(() => {
    // Listen to activities
    const unsubscribe = onSnapshot(collection(db, "activities"), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Activity));
      setActivities(fetched);
    });

    // Get live user location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
          if (mapRef) {
            mapRef.flyTo(loc, 13); // Zoom to user location
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => unsubscribe();
  }, [mapRef]);

  // Calculate map center based on activities
  const defaultCenter: [number, number] = [12.9716, 77.5946]; // Bangalore
  
  // Custom Leaflet icon generator
  const createIcon = (a: Activity, isSel: boolean) => {
    const cat = CATEGORIES.find((c) => c.name === a.category) || CATEGORIES[0];
    const bg = a.custom ? "hsl(var(--primary))" : cat.color;
    
    // Convert our React pin into an HTML string for Leaflet
    const htmlString = ReactDOMServer.renderToString(
      <div className={`relative flex flex-col items-center transition-transform ${isSel ? "scale-110" : ""}`}>
        {a.custom && (
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/40" />
        )}
        <div
          className={`relative grid h-10 w-10 place-items-center rounded-full text-lg shadow-glow ${a.custom ? "ring-4 ring-primary/30" : "ring-4 ring-white"}`}
          style={{ background: bg, color: '#fff' }}
        >
          {cat.icon}
        </div>
        <div
          className="relative -mt-1 h-2.5 w-2.5 rotate-45"
          style={{ background: bg }}
        />
        {a.custom && (
          <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground shadow-soft">
            Custom
          </span>
        )}
      </div>
    );

    return L.divIcon({
      className: "custom-pin",
      html: htmlString,
      iconSize: [40, 48],
      iconAnchor: [20, 48],
    });
  };

  const userLocationIcon = L.divIcon({
    className: "custom-pin",
    html: ReactDOMServer.renderToString(
      <div className="relative flex items-center justify-center">
        <span className="absolute h-8 w-8 animate-ping rounded-full bg-blue-500/50" />
        <div className="relative h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg" />
      </div>
    ),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <div className="relative h-screen overflow-hidden bg-background">
      {/* Real Interactive Map */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={defaultCenter} 
          zoom={12} 
          zoomControl={false} 
          className="h-full w-full"
          ref={setMapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          {/* User's live location marker */}
          {userLocation && (
            <Marker position={userLocation} icon={userLocationIcon} zIndexOffset={2000} />
          )}
          {activities.map((a) => (
            <Marker
              key={a.id}
              position={[a.lat, a.lng]}
              icon={createIcon(a, selected === a.id)}
              eventHandlers={{
                click: () => setSelected(a.id),
              }}
              zIndexOffset={selected === a.id ? 1000 : 1}
            />
          ))}
        </MapContainer>
      </div>

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-30 px-4 pt-12">
        <div className="flex items-center gap-2">
          <Link to="/home" className="grid h-11 w-11 place-items-center rounded-full bg-card shadow-card">
            <X className="h-5 w-5" />
          </Link>
          <div className="flex flex-1 items-center gap-2 rounded-full bg-card px-4 py-3 shadow-card cursor-pointer active:scale-[0.98] transition-transform" onClick={() => {
            if (userLocation && mapRef) mapRef.flyTo(userLocation, 14);
          }}>
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold truncate">
              {userLocation ? "Current Location" : "Locating..."}
            </span>
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-full bg-card shadow-card"
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {["All", ...CATEGORIES.map(c => c.name)].map((n) => (
            <button key={n} className="shrink-0 rounded-full bg-card px-3.5 py-1.5 text-xs font-semibold shadow-soft">
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Selected pin preview */}
      {selected && (
        <div className="absolute inset-x-4 bottom-28 z-30 animate-fade-in">
          <ActivityCard activity={activities.find((a) => a.id === selected)!} variant="compact" />
        </div>
      )}

      {/* Bottom sheet toggle */}
      <button
        onClick={() => setSheet(true)}
        className="absolute bottom-28 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-glow"
      >
        <List className="h-4 w-4" /> {activities.length} activities
      </button>

      {/* Sheet */}
      {sheet && (
        <div className="absolute inset-0 z-40 flex flex-col bg-black/40 animate-fade-in" onClick={() => setSheet(false)}>
          <div className="mt-auto max-h-[75vh] overflow-y-auto rounded-t-3xl bg-background animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-background px-5 pb-3 pt-3">
              <div className="mx-auto h-1.5 w-12 rounded-full bg-border" />
              <div className="mt-4 flex items-center justify-between">
                <h2 className="text-lg font-extrabold">All activities</h2>
                <button onClick={() => setSheet(false)} className="grid h-9 w-9 place-items-center rounded-full bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-4 px-5 pb-8">
              {activities.map((a) => <ActivityCard key={a.id} activity={a} />)}
            </div>
          </div>
        </div>
      )}

      {filterOpen && <FiltersSheet onClose={() => setFilterOpen(false)} />}
    </div>
  );
}

function FiltersSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="mt-auto w-full rounded-t-3xl bg-background animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pb-8 pt-3">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-border" />
          <h2 className="mt-4 text-lg font-extrabold">Filters</h2>
          <div className="mt-5 space-y-5">
            <FilterGroup label="Distance" options={["1 km", "5 km", "10 km", "25 km"]} active="5 km" />
            <FilterGroup label="Time" options={["Today", "Tomorrow", "This week", "Anytime"]} active="This week" />
            <FilterGroup label="Type" options={["Free", "Paid", "Indoor", "Outdoor"]} active="Free" />
          </div>
          <button onClick={onClose} className="mt-6 w-full rounded-2xl bg-gradient-primary py-3.5 text-base font-semibold text-primary-foreground shadow-glow">
            Show 24 results
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, options, active }: { label: string; options: string[]; active: string }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${
              o === active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
