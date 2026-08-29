// Types globaux Drive-Path — à compléter au fil des étapes

export type UserRole = "learner" | "instructor" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: Date;
}

export interface Instructor {
  id: string;
  userId: string;
  bio: string;
  location: string;
  pricePerHour: number;
  rating: number;
  reviewCount: number;
}

export interface Learner {
  id: string;
  userId: string;
  level: "beginner" | "intermediate" | "advanced";
}

export interface Booking {
  id: string;
  learnerId: string;
  instructorId: string;
  date: Date;
  durationHours: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  read: boolean;
}
