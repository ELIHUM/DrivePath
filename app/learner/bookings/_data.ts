/* ═══════════════════════════════════════════════════════════
   DONNÉES FICTIVES — Réservations apprenant
   Remplacer par une vraie source de données (API / BDD)
   lors d'une prochaine étape.
═══════════════════════════════════════════════════════════ */

export type BookingStatus = "confirmed" | "pending" | "completed" | "cancelled";

export type MockBooking = {
  id: string;
  instructorId: string;
  instructorName: string;
  instructorInitials: string;
  instructorAvatarBg: string;
  instructorCity: string;
  /** Ex : "Mardi 1 septembre 2026" */
  dateLabel: string;
  /** ISO : "2026-09-01" */
  dateISO: string;
  timeStart: string;
  timeEnd: string;
  duration: string;
  lessonType: string;
  price: number;
  status: BookingStatus;
};

export const MOCK_BOOKINGS: MockBooking[] = [
  {
    id: "booking-1",
    instructorId: "thomas-m",
    instructorName: "Thomas M.",
    instructorInitials: "TM",
    instructorAvatarBg: "bg-navy",
    instructorCity: "Moncton",
    dateLabel: "Mardi 1 septembre 2026",
    dateISO: "2026-09-01",
    timeStart: "09:00",
    timeEnd: "10:00",
    duration: "1 heure",
    lessonType: "Leçon de conduite",
    price: 45,
    status: "confirmed",
  },
  {
    id: "booking-2",
    instructorId: "karim-b",
    instructorName: "Karim B.",
    instructorInitials: "KB",
    instructorAvatarBg: "bg-[#5B7FA6]",
    instructorCity: "Fredericton",
    dateLabel: "Mardi 8 septembre 2026",
    dateISO: "2026-09-08",
    timeStart: "14:00",
    timeEnd: "15:30",
    duration: "1 h 30",
    lessonType: "Première leçon d'évaluation",
    price: 63,
    status: "pending",
  },
  {
    id: "booking-3",
    instructorId: "sophie-l",
    instructorName: "Sophie L.",
    instructorInitials: "SL",
    instructorAvatarBg: "bg-green-dp",
    instructorCity: "Saint John",
    dateLabel: "Lundi 25 août 2026",
    dateISO: "2026-08-25",
    timeStart: "14:00",
    timeEnd: "15:00",
    duration: "1 heure",
    lessonType: "Préparation à l'examen",
    price: 50,
    status: "completed",
  },
  {
    id: "booking-4",
    instructorId: "thomas-m",
    instructorName: "Thomas M.",
    instructorInitials: "TM",
    instructorAvatarBg: "bg-navy",
    instructorCity: "Moncton",
    dateLabel: "Samedi 15 août 2026",
    dateISO: "2026-08-15",
    timeStart: "10:00",
    timeEnd: "11:00",
    duration: "1 heure",
    lessonType: "Leçon de conduite",
    price: 45,
    status: "completed",
  },
  {
    id: "booking-5",
    instructorId: "karim-b",
    instructorName: "Karim B.",
    instructorInitials: "KB",
    instructorAvatarBg: "bg-[#5B7FA6]",
    instructorCity: "Fredericton",
    dateLabel: "Mercredi 5 août 2026",
    dateISO: "2026-08-05",
    timeStart: "11:00",
    timeEnd: "12:00",
    duration: "1 heure",
    lessonType: "Leçon de conduite",
    price: 42,
    status: "cancelled",
  },
];

export function getBookingById(id: string): MockBooking | undefined {
  return MOCK_BOOKINGS.find((b) => b.id === id);
}
