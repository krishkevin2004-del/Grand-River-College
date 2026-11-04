import directory from "../data/campus_directory.json";
import { CONFIG } from "./config";
import { normalizeQuestion } from "./escalation";

export const HALLS = directory.halls;
export type Hall = typeof HALLS[number];
export const NEIGHBORHOODS = [...new Set(HALLS.map((hall) => hall.district))];
export const RESIDENTIAL_DUTY = directory.contacts.find((contact) => contact.id === "C03")!;

export function matchHall(text: string, shortReply = false) {
  const normalized = normalizeQuestion(text);
  return HALLS.find((hall) =>
    ` ${normalized} `.includes(` ${hall.name.toLowerCase()} `) ||
    (shortReply && normalized === hall.id)
  ) ?? null;
}

export function isRaOnDuty(now = new Date(`${CONFIG.demoDate}T20:00:00Z`)) {
  const local = new Intl.DateTimeFormat("en-US", {
    weekday: "short", hour: "numeric", hourCycle: "h23", timeZone: CONFIG.raOnDuty.timeZone,
  }).formatToParts(now);
  const hour = Number(local.find((part) => part.type === "hour")?.value);
  const weekend = local.some((part) => part.type === "weekday" && ["Sat", "Sun"].includes(part.value));
  return weekend ? hour < 10 || hour >= 20 : hour < 8 || hour >= 22;
}

export function isRaContactRequest(text: string) {
  const q = normalizeQuestion(text);
  return /\b(ra|resident assistant)\b.*\b(phone|number|contact|on duty)\b|\b(call|reach|contact|find)\b.*\b(ra|resident assistant)\b/.test(q);
}
