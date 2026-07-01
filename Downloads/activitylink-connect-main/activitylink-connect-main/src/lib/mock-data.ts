// Mock data for ActivityLink MVP
export type Category =
  | "Cricket" | "Football" | "Badminton" | "Gym" | "Running"
  | "Coding" | "Study" | "Startup" | "Photography"
  | "Travel" | "Food" | "Networking" | "Other";

export const CATEGORIES: { name: Category; icon: string; color: string }[] = [
  { name: "Cricket", icon: "🏏", color: "oklch(0.78 0.15 80)" },
  { name: "Football", icon: "⚽", color: "oklch(0.7 0.16 145)" },
  { name: "Badminton", icon: "🏸", color: "oklch(0.72 0.15 200)" },
  { name: "Gym", icon: "💪", color: "oklch(0.68 0.19 30)" },
  { name: "Running", icon: "🏃", color: "oklch(0.74 0.17 55)" },
  { name: "Coding", icon: "💻", color: "oklch(0.55 0.18 280)" },
  { name: "Study", icon: "📚", color: "oklch(0.6 0.15 250)" },
  { name: "Startup", icon: "🚀", color: "oklch(0.65 0.2 15)" },
  { name: "Photography", icon: "📷", color: "oklch(0.5 0.05 260)" },
  { name: "Travel", icon: "✈️", color: "oklch(0.7 0.15 220)" },
  { name: "Food", icon: "🍜", color: "oklch(0.72 0.17 40)" },
  { name: "Networking", icon: "🤝", color: "oklch(0.65 0.14 300)" },
  { name: "Other", icon: "✨", color: "oklch(0.65 0.05 260)" },
];

export const RADIUS_OPTIONS = [1, 5, 10, 25];

export type User = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  rating: number;
  bio?: string;
  verified?: boolean;
  interests?: string[];
};

export const USERS: User[] = [
  { id: "u1", name: "Aarav Sharma", age: 26, avatar: "https://i.pravatar.cc/200?img=12", rating: 4.8, bio: "Weekend cricketer & coffee snob", verified: true },
  { id: "u2", name: "Priya Patel", age: 24, avatar: "https://i.pravatar.cc/200?img=47", rating: 4.9, verified: true },
  { id: "u3", name: "Rohan Mehta", age: 29, avatar: "https://i.pravatar.cc/200?img=33", rating: 4.6 },
  { id: "u4", name: "Sara Khan", age: 22, avatar: "https://i.pravatar.cc/200?img=45", rating: 5.0, verified: true },
  { id: "u5", name: "Vikram Singh", age: 31, avatar: "https://i.pravatar.cc/200?img=15", rating: 4.7 },
  { id: "u6", name: "Neha Gupta", age: 27, avatar: "https://i.pravatar.cc/200?img=49", rating: 4.5, verified: true },
  { id: "u7", name: "Arjun Rao", age: 25, avatar: "https://i.pravatar.cc/200?img=8", rating: 4.4 },
  { id: "u8", name: "Maya Iyer", age: 28, avatar: "https://i.pravatar.cc/200?img=44", rating: 4.9, verified: true },
];

export const ME: User = {
  id: "me",
  name: "You",
  age: 25,
  avatar: "https://i.pravatar.cc/200?img=68",
  rating: 4.8,
  bio: "Explorer of new activities",
  verified: true,
};

export type Activity = {
  id: string;
  title: string;
  category: Category;
  description: string;
  organizer: User;
  participants: User[];
  maxParticipants: number;
  distanceKm: number;
  date: string; // ISO
  location: string;
  lat: number;
  lng: number;
  joined?: boolean;
  autoApprove?: boolean;
  image?: string;
  custom?: boolean;
  hideExactLocation?: boolean;
};

const now = Date.now();
const inHours = (h: number) => new Date(now + h * 3600_000).toISOString();

export const ACTIVITIES: Activity[] = [
  // ── CUSTOM (user-created) — appear first & prominently ──
  {
    id: "c1",
    title: "Anyone for chai near MG Road? ☕",
    category: "Food",
    description: "Just wrapped work early — heading to Koshy's for chai and samosa. Would love company for a chill hour before I head home. Zero agenda.",
    organizer: USERS[5],
    participants: [USERS[5], USERS[2]],
    maxParticipants: 6,
    distanceKm: 0.6,
    date: inHours(2),
    location: "Koshy's, St. Marks Road",
    lat: 12.9720, lng: 77.6000,
    autoApprove: true,
    custom: true,
    image: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=800",
  },
  {
    id: "c2",
    title: "Sunset walk at Ulsoor Lake 🌇",
    category: "Other",
    description: "I try to walk the lake loop every evening. Looking for 1–2 people to walk with — good pace, real conversation. No phones.",
    organizer: USERS[1],
    participants: [USERS[1]],
    maxParticipants: 4,
    distanceKm: 2.1,
    date: inHours(5),
    location: "Ulsoor Lake, East gate",
    lat: 12.9826, lng: 77.6206,
    autoApprove: true,
    custom: true,
    image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800",
  },
  {
    id: "c3",
    title: "Need coding partner for weekend hackathon 💻",
    category: "Coding",
    description: "Building a small AI side-project this weekend for a local hackathon. Frontend done, need a backend/infra buddy. Beer & food on me.",
    organizer: USERS[3],
    participants: [USERS[3], USERS[7]],
    maxParticipants: 3,
    distanceKm: 3.2,
    date: inHours(36),
    location: "91springboard, Koramangala",
    lat: 12.9352, lng: 77.6245,
    custom: true,
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
  },
  {
    id: "c4",
    title: "Bookstore hop + coffee 📚",
    category: "Other",
    description: "Planning to hit Blossoms, Champaca and Bookworm on Saturday. Looking for fellow book nerds to swap recs and grab filter coffee between stops.",
    organizer: USERS[7],
    participants: [USERS[7], USERS[1], USERS[3]],
    maxParticipants: 6,
    distanceKm: 4.4,
    date: inHours(42),
    location: "Church Street",
    lat: 12.9740, lng: 77.6080,
    autoApprove: true,
    custom: true,
    image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800",
  },

  // ── PREDEFINED / seeded ──
  {
    id: "a1",
    title: "Sunday Morning Cricket Match",
    category: "Cricket",
    description: "Casual 8-a-side match at the community ground. All skill levels welcome. Bring your own kit if possible.",
    organizer: USERS[0],
    participants: [USERS[0], USERS[2], USERS[4], USERS[6]],
    maxParticipants: 16,
    distanceKm: 1.2,
    date: inHours(18),
    location: "Cubbon Park Ground",
    lat: 12.9763, lng: 77.5929,
    autoApprove: true,
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800",
  },
  {
    id: "a2",
    title: "5K Sunrise Run",
    category: "Running",
    description: "Easy pace 5K loop around the lake. Coffee after for those who want to stay.",
    organizer: USERS[1],
    participants: [USERS[1], USERS[3], USERS[5]],
    maxParticipants: 20,
    distanceKm: 2.4,
    date: inHours(14),
    location: "Ulsoor Lake",
    lat: 12.9826, lng: 77.6206,
    image: "https://images.unsplash.com/photo-1486218119243-13883505764c?w=800",
  },
  {
    id: "a3",
    title: "Startup Founders Coffee",
    category: "Startup",
    description: "Informal meetup for early-stage founders. Trade war stories, hiring tips, and maybe pitch.",
    organizer: USERS[2],
    participants: [USERS[2], USERS[7]],
    maxParticipants: 12,
    distanceKm: 3.8,
    date: inHours(28),
    location: "Third Wave Coffee, Indiranagar",
    lat: 12.9719, lng: 77.6412,
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800",
  },
  {
    id: "a4",
    title: "React + TypeScript Study Group",
    category: "Coding",
    description: "Weekly study group. This week: server components and suspense patterns.",
    organizer: USERS[3],
    participants: [USERS[3], USERS[0], USERS[7], USERS[5], USERS[6]],
    maxParticipants: 10,
    distanceKm: 4.5,
    date: inHours(48),
    location: "WeWork Galaxy",
    lat: 12.9698, lng: 77.6205,
    joined: true,
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
  },
  {
    id: "a5",
    title: "Evening Badminton Doubles",
    category: "Badminton",
    description: "Doubles rotation, indoor wooden court. Need 2 more for a full bracket.",
    organizer: USERS[4],
    participants: [USERS[4], USERS[1]],
    maxParticipants: 8,
    distanceKm: 0.8,
    date: inHours(6),
    location: "Smash Arena",
    lat: 12.9750, lng: 77.5950,
    autoApprove: true,
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800",
  },
  {
    id: "a6",
    title: "Street Photography Walk",
    category: "Photography",
    description: "Golden hour walk through the old market. Any camera, any phone — show up and shoot.",
    organizer: USERS[5],
    participants: [USERS[5], USERS[7], USERS[3]],
    maxParticipants: 15,
    distanceKm: 5.2,
    date: inHours(30),
    location: "Commercial Street",
    lat: 12.9833, lng: 77.6090,
    image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800",
  },
  {
    id: "a7",
    title: "Gym Buddies — Push Day",
    category: "Gym",
    description: "Looking for a spotter / accountability partner. Push routine, ~75 min.",
    organizer: USERS[6],
    participants: [USERS[6]],
    maxParticipants: 4,
    distanceKm: 2.1,
    date: inHours(10),
    location: "Cult Gym Koramangala",
    lat: 12.9352, lng: 77.6245,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
  },
  {
    id: "a8",
    title: "Sunday Football Pickup",
    category: "Football",
    description: "5-a-side pickup match. Turf booked, just show up with boots.",
    organizer: USERS[7],
    participants: [USERS[7], USERS[0], USERS[2], USERS[4], USERS[6], USERS[1]],
    maxParticipants: 10,
    distanceKm: 6.0,
    date: inHours(22),
    location: "Turf Park HSR",
    lat: 12.9116, lng: 77.6446,
    image: "https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=800",
  },
];

export function getActivity(id: string) {
  return ACTIVITIES.find((a) => a.id === id);
}

export type Message = {
  id: string;
  user: User;
  text: string;
  at: string;
  system?: boolean;
};

export const MESSAGES: Record<string, Message[]> = {
  a4: [
    { id: "m1", user: USERS[3], text: "Hey everyone! Welcome to this week's session 🎉", at: inHours(-4) },
    { id: "m2", user: USERS[3], text: "I'll share the agenda in a bit", at: inHours(-3.9) },
    { id: "m3", user: USERS[0], text: "Looking forward to it!", at: inHours(-3.5) },
    { id: "m4", user: USERS[7], text: "Will we cover the new use() hook?", at: inHours(-2) },
    { id: "m5", user: ME, text: "Yes please 🙏", at: inHours(-1.5) },
    { id: "m6", user: USERS[3], text: "Yep — plan is: 20 min intro, 30 min code-along, 20 min Q&A", at: inHours(-1) },
    { id: "m7", user: USERS[5], text: "Perfect. See you all there.", at: inHours(-0.5) },
  ],
  c1: [
    { id: "cm1", user: USERS[5], text: "I'm already here — grabbing a corner table 👋", at: inHours(-0.4) },
    { id: "cm2", user: USERS[2], text: "5 min away, coming!", at: inHours(-0.2) },
  ],
};

/** Group-chat previews for the Chats tab — only activities the user has joined. */
export type ChatThread = {
  activityId: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

export const CHAT_THREADS: ChatThread[] = [
  { activityId: "a4", lastMessage: "Perfect. See you all there.", lastAt: inHours(-0.5), unread: 2 },
  { activityId: "c1", lastMessage: "5 min away, coming!", lastAt: inHours(-0.2), unread: 1 },
];

/** Mutual connections (trust layer — private chat unlocked). */
export type Connection = {
  user: User;
  mutualActivities: number;
  status: "connected" | "pending_incoming" | "pending_outgoing";
  lastMessage?: string;
  lastAt?: string;
};

export const CONNECTIONS: Connection[] = [
  { user: USERS[3], mutualActivities: 3, status: "connected", lastMessage: "Great session today!", lastAt: inHours(-2) },
  { user: USERS[7], mutualActivities: 2, status: "connected", lastMessage: "Sharing that book list", lastAt: inHours(-20) },
  { user: USERS[5], mutualActivities: 1, status: "pending_incoming" },
  { user: USERS[1], mutualActivities: 2, status: "pending_outgoing" },
];

export type Notification = {
  id: string;
  type: "join_request" | "update" | "recommendation" | "low_participants" | "connection";
  title: string;
  body: string;
  at: string;
  user?: User;
  activity?: Activity;
};

export const NOTIFICATIONS: Notification[] = [
  {
    id: "n1", type: "join_request",
    title: "New join request",
    body: "wants to join your activity",
    at: inHours(-0.3),
    user: USERS[6],
    activity: ACTIVITIES.find((a) => a.id === "a4"),
  },
  {
    id: "n5", type: "connection",
    title: "Connection request",
    body: "wants to connect after your shared activity",
    at: inHours(-0.6),
    user: USERS[5],
  },
  {
    id: "n2", type: "update",
    title: "Activity starts in 2 hours",
    body: "React + TypeScript Study Group at WeWork Galaxy",
    at: inHours(-1),
    activity: ACTIVITIES.find((a) => a.id === "a4"),
  },
  {
    id: "n3", type: "low_participants",
    title: "Your activity needs more people",
    body: "Gym Buddies — Push Day has only 1 participant. Try sharing it.",
    at: inHours(-3),
    activity: ACTIVITIES.find((a) => a.id === "a7"),
  },
  {
    id: "n4", type: "recommendation",
    title: "Custom activities near you",
    body: "3 new user-created meetups within 2 km this evening.",
    at: inHours(-8),
  },
];
