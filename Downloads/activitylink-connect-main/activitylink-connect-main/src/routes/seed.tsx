import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { doc, setDoc, collection, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { USERS, ACTIVITIES, CHAT_THREADS, CONNECTIONS, NOTIFICATIONS } from "@/lib/mock-data";

export const Route = createFileRoute("/seed")({
  component: SeedData,
});

function SeedData() {
  const [status, setStatus] = useState("Idle. Click to seed data.");
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    setStatus("Seeding data...");
    
    try {
      // Create a batch
      const batch = writeBatch(db);

      // Seed Users
      USERS.forEach((u) => {
        const ref = doc(collection(db, "users"), u.id);
        batch.set(ref, u);
      });

      // Seed Activities
      ACTIVITIES.forEach((a) => {
        const ref = doc(collection(db, "activities"), a.id);
        batch.set(ref, a);
      });

      // Seed Chat Threads
      CHAT_THREADS.forEach((c) => {
        const ref = doc(collection(db, "chats"), c.activityId);
        batch.set(ref, c);
      });

      // Seed Connections
      CONNECTIONS.forEach((c) => {
        const ref = doc(collection(db, "connections"), c.user.id);
        batch.set(ref, c);
      });
      
      // Seed Notifications
      NOTIFICATIONS.forEach((n) => {
        const ref = doc(collection(db, "notifications"), n.id);
        batch.set(ref, n);
      });

      await batch.commit();
      setStatus("Successfully seeded all mock data into Firestore! You can safely delete this file.");
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Firestore Data Seeder</h1>
      <p className="mb-4 text-muted-foreground">
        This will take the data from `mock-data.ts` and upload it to your Firestore database.
      </p>
      <button 
        onClick={handleSeed}
        disabled={loading}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold disabled:opacity-50"
      >
        {loading ? "Seeding..." : "Seed Database"}
      </button>
      <div className="mt-4 p-4 bg-muted rounded-lg font-mono text-sm">
        {status}
      </div>
    </div>
  );
}
