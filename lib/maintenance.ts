// Sample maintenance request: a five-step form that never leaves the browser.
// Every name, room and reference number here is fictional, and nothing is sent
// to a server or logged. It shows how a real work-order form would feel.

export const FLOORS = [1, 2, 3] as const;
export const ROOMS_PER_FLOOR = 20;

/** Rooms 101–120 on floor 1, 201–220 on floor 2, 301–320 on floor 3. */
export function roomsOnFloor(floor: number): string[] {
  return Array.from({ length: ROOMS_PER_FLOOR }, (_, i) => String(floor * 100 + i + 1));
}

export const SAMPLE_NAMES = ["Avery Riverside", "Jordan Brook", "Sam Willowby", "Riley Stonefield", "Casey Harbor"] as const;

export type Priority = "urgent" | "high" | "standard";

export const ISSUES: { id: string; label: string; priority: Priority }[] = [
  { id: "leak", label: "Leak or water on the floor", priority: "urgent" },
  { id: "toilet", label: "Toilet or drain clogged", priority: "high" },
  { id: "heat", label: "Heating or cooling not working", priority: "high" },
  { id: "lock", label: "Door or lock not working", priority: "high" },
  { id: "power", label: "Light, outlet or power problem", priority: "high" },
  { id: "pest", label: "Pests or insects", priority: "standard" },
  { id: "window", label: "Window, screen or blinds", priority: "standard" },
  { id: "furniture", label: "Bed, desk or other furniture", priority: "standard" },
  { id: "network", label: "Network jack or wall port", priority: "standard" },
  { id: "other", label: "Something else", priority: "standard" },
];

export const PRIORITY_COPY: Record<Priority, { label: string; detail: string }> = {
  urgent: { label: "Urgent", detail: "Facilities handles urgent requests first, usually the same day." },
  high: { label: "High", detail: "Facilities aims to visit within one business day." },
  standard: { label: "Standard", detail: "Facilities schedules standard repairs within a few business days." },
};

/** A fictional, non-real reference such as "GRU-MX-4821". */
export function sampleReference(seed = Date.now()): string {
  return `GRU-MX-${String(1000 + (Math.abs(seed) % 9000))}`;
}
