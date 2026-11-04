import directory from "../data/campus_directory.json";
import dining from "../data/dining.json";
import calendar from "../data/events.json";
import handbook from "../data/handbook-index.json";
import { CONFIG } from "./config";
import { matchHall } from "./halls";
import type { AssistantReply, Citation } from "./types";

type Answer = Extract<AssistantReply, { type: "answer" }>;
const reply = (answer: string, citations: Citation[]): Answer => ({ type: "answer", answer, citations });
const records = new Map(dining.items.map((item) => [item.id, item]));
const dayMs = 86_400_000;
const today = Date.parse(CONFIG.demoDate);

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_RE = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?";
const demoYear = new Date(today).getUTCFullYear();

/** ISO date for a real calendar day, or null when the day does not exist (Feb 30, month 13...). */
function isoDay(year: number, month: number, day: number) {
  const value = new Date(Date.UTC(year, month - 1, day));
  if (value.getUTCFullYear() !== year || value.getUTCMonth() !== month - 1 || value.getUTCDate() !== day) return null;
  return value.toISOString().slice(0, 10);
}
const fullYear = (raw?: string) => (raw ? (raw.length === 2 ? 2000 + Number(raw) : Number(raw)) : demoYear);

/** A date written out in the question, in any common format. undefined = none mentioned; null = mentioned but invalid. */
function writtenDate(q: string): string | null | undefined {
  let m = q.match(/\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b/);
  if (m) return isoDay(Number(m[1]), Number(m[2]), Number(m[3]));
  m = q.match(new RegExp(`\\b${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`));
  if (m) return isoDay(fullYear(m[3]), MONTHS.indexOf(m[1].slice(0, 3)) + 1, Number(m[2]));
  m = q.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_RE}(?:,?\\s+(\\d{4}))?\\b`));
  if (m) return isoDay(fullYear(m[3]), MONTHS.indexOf(m[2].slice(0, 3)) + 1, Number(m[1]));
  m = q.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?\b/) ?? q.match(/\b(\d{1,2})-(\d{1,2})-(\d{4})\b/);
  if (m) return isoDay(fullYear(m[3]), Number(m[1]), Number(m[2]));
  m = q.match(/\bthe (\d{1,2})(?:st|nd|rd|th)\b/);
  if (m) return isoDay(demoYear, new Date(today).getUTCMonth() + 1, Number(m[1]));
  m = q.match(/\b(?:in|during|for|of) (\d{4})\b/);
  if (m && Number(m[1]) !== demoYear) return isoDay(Number(m[1]), 1, 1);
  return undefined;
}

function datesFor(q: string) {
  const written = writtenDate(q);
  if (written !== undefined) return written ? [written] : [];
  const shift = (n: number) => new Date(today + n * dayMs).toISOString().slice(0, 10);
  const span = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => shift(from + i));
  if (/\bweekend\b/.test(q)) {
    const saturday = (6 - new Date(today).getUTCDay() + 7) % 7;
    return [shift(saturday), shift(saturday + 1)];
  }
  if (/\bnext week\b/.test(q)) return span(7, 13);
  if (/\blast week\b/.test(q)) return span(-7, -1);
  if (/\bday after tomorrow\b/.test(q)) return [shift(2)];
  if (/\byesterday\b/.test(q)) return [shift(-1)];
  const weekday = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    .findIndex((day) => new RegExp(`\\b${day}\\b`).test(q));
  if (weekday >= 0) {
    const ahead = (weekday - new Date(today).getUTCDay() + 7) % 7;
    return [shift(/\bnext (sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/.test(q) ? ahead + 7 : ahead)];
  }
  return [shift(/\btomorrow\b/.test(q) ? 1 : 0)];
}

const rules: Record<string, RegExp> = {
  "05.1": /building access|swipe in|public lobby|prop.*door/,
  "05.2": /lockout|locked out|lost.*(key|card)|replacement key/,
  "05.3": /guest|visitor|overnight stay|friend.*stay/,
  "06.1": /quiet|courtesy hours|noise|finals.*hours/,
  "06.2": /recording|door camera|film.*room/,
  "06.3": /roommate agreement|roommate conflict|harass/,
  "08.1": /fridge|refrigerator|microwave|power strip|surge protector/,
  "08.2": /air fryer|hot plate|kettle|grill|cook.*room/,
  "08.3": /air condition|space heater|portable heater|personal fan/,
  "09.1": /fire drill|alarm|evacuat/,
  "07.1": /alcohol|beer|controlled substance/,
  "07.2": /smok|vap(e|ing)|cigarette/,
  "07.3": /weapon|firework|gambl/,
  "09.2": /candle|incense|sprinkler/,
  "09.3": /scooter|e-bike|bicycle/,
  "10.1": /\bpets?\b|fish tank|aquarium|assistance animal/,
  "10.3": /laundry|washer|dryer/,
  "11.1": /flyer|posting/,
  "12.3": /room change|switch rooms|move rooms|swap rooms|change rooms/,
  "13.2": /bed adjustment|loft|room condition/,
  "13.3": /room entry|enter my room|maintenance ticket|routine repair/,
  "14.1": /pickup notice|address a package|ship a package|mailing format/,
  "14.2": /unclaimed package|forward.*package|perishable|how long.*package/,
  "14.3": /lost property|missing mail|lost and found/,
  "15.1": /move.?in|check.?in date/,
  "15.2": /winter break|break housing|fall recess/,
  "15.3": /checkout|move.?out|damage charge/,
  "17.1": /cancel.*housing|pre.arrival|cancellation fee/,
  "17.2": /buyout|contract release|end.*contract/,
  "18.1": /meal plan|dining plan|guest entry/,
  "18.2": /takeout|takeaway|sick meal/,
  "18.3": /allerg|cross.contact|celiac|gluten.free/,
  "19.1": /wi.?fi|internet|network/,
  "03.1": /live.on requirement|live on campus|exemption/,
  "03.2": /accommodation|accessible room/,
  "03.3": /gender.inclusive|family housing|substance.free/,
};

export function housingReply(id: string) {
  const section = handbook.chunks.find((chunk) => chunk.id === id);
  if (!section) return null;
  return reply(section.text, [{
    source: handbook.handbookTitle, section: section.section, passage: section.text,
    label: `Resident Handbook · §${id} · p. ${section.pageStart}`,
    url: `/handbook.pdf#page=${section.pageStart}`,
  }]);
}

function contacts(q: string) {
  if (!/\b(phone|number|contact|desk|address|dispatch)\b/.test(q)) return null;
  const hall = matchHall(q);
  const office = directory.contacts.find((contact) => q.includes(contact.name.toLowerCase().replace(/^gru /, "")))
    ?? (/\bpolice\b/.test(q) ? directory.contacts.find((contact) => contact.id === (/non.?emergency/.test(q) ? "C02" : "C01")) : undefined);
  if (!hall && !office) return null;
  const entry = office ?? hall!;
  const text = office
    ? `${office.name}: ${office.phone} (fictional placeholder). ${office.hours}.`
    : `${hall!.name}: ${hall!.desk_phone} (fictional placeholder). Desk hours: weekdays 08:00–22:00, weekends 10:00–20:00. Address: ${hall!.mail_address}.`;
  return reply(text, [{ source: "Campus directory", section: entry.id, passage: text, label: `Campus directory · ${entry.name}` }]);
}

function eventAnswer(q: string, dates: string[]) {
  const named = calendar.events.filter((event) => q.includes(event.title.toLowerCase()));
  const active = calendar.events.filter((event) => dates.includes(event.date) && event.status !== "cancelled");
  const events = (named.length ? named : active.filter((event) => !/\bfree\b/.test(q) || event.cost_usd === 0)).slice(0, 8);
  if (!events.length) return { type: "not_found", source: "events", note: `No matching events. The demo calendar covers ${calendar.event_start} through ${calendar.event_end}.` } as const;
  const citations = events.map((event) => {
    const passage = event.status === "cancelled"
      ? `${event.title} was cancelled. ${event.revision?.reason ?? ""}`
      : `${event.title} · ${event.date}, ${event.start}–${event.end} · ${event.location} · ${event.cost_usd ? "$" + event.cost_usd : "free"} · RSVP: ${event.rsvp}. ${event.audience}. ${event.accessibility}.${event.status === "rescheduled" ? " This is the revised date and venue." : ""}`;
    return { source: "Student Programs Board", section: event.id, passage, label: `Events · ${event.title}` };
  });
  return reply(citations.map((citation) => citation.passage).join("\n\n"), citations);
}

function diningAnswer(q: string, dates: string[]) {
  const meal = q.match(/\b(breakfast|lunch|dinner|late night)\b/)?.[1]?.replace(" ", "_");
  const matched = dining.venues.filter((v) => q.includes(v.name.toLowerCase()) || new RegExp(`\\b${v.hall_id}\\b`).test(q));
  const venues = matched.length ? matched : dining.venues;
  const tag = /\bvegan\b/.test(q) ? "vegan" : /\bvegetarian\b/.test(q) ? "vegetarian" : /\bhalal\b/.test(q) ? "halal_certified_preparation" : undefined;
  const namedDish = dining.items.find((item) => q.includes(item.name.toLowerCase()));
  const cuisine = dining.items.find((item) => new RegExp(`\\b${item.cuisine.toLowerCase()}\\b`).test(q))?.cuisine;
  const hoursOnly = /\b(open|close|closes|hours)\b/.test(q) && !meal && !tag && !cuisine && !namedDish;
  const after = q.match(/\bafter\s+(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?\b/);
  let cutoff = "";
  if (after) {
    const raw = Number(after[1]);
    const hour = after[3] ? raw % 12 + (after[3] === "pm" ? 12 : 0) : raw < 12 ? raw + 12 : raw;
    cutoff = `${String(hour).padStart(2, "0")}:${after[2] ?? "00"}`;
  }
  const citations: Citation[] = [];
  const add = (label: string, section: string, passage: string) => citations.push({ source: "Grand River Dining", section, passage, label });
  for (const day of dates) {
    if (day < dining.menu_start || day > dining.menu_end) continue;
    for (const venue of venues) {
      const override = dining.schedule_overrides.find((o) => o.date === day && o.venue_id === venue.id);
      if (override) {
        if (matched.length) add(`Dining closure · ${venue.name} · ${day}`, `${day}/${venue.id}/closure`, `${venue.name} is closed on ${day}. ${override.reason}.`);
        continue;
      }
      if (hoursOnly) {
        const dayOfWeek = new Date(day).getUTCDay();
        const [open, close] = dayOfWeek === 0 || dayOfWeek === 6 ? venue.weekend_hours : venue.weekday_hours;
        if (close > cutoff) add(`Dining hours · ${venue.name} · ${day}`, `${day}/${venue.id}/hours`, `${venue.name} · ${day} · ${open}–${close}.`);
        continue;
      }
      for (const row of dining.menus) {
        if (row.date !== day || row.venue_id !== venue.id || row.end <= cutoff || (meal && row.meal !== meal)) continue;
        const dishes = row.item_ids.map((id) => records.get(id)!).filter((item) =>
          (!tag || item.dietary_tags.some((value) => value === tag)) && (!cuisine || cuisine === item.cuisine) && (!namedDish || item.id === namedDish.id)
        );
        if (dishes.length) add(`Menu · ${venue.name} · ${day} · ${row.meal.replace("_", " ")}`, row.id,
          `${venue.name} · ${day} · ${row.meal.replace("_", " ")} ${row.start}–${row.end}: ${dishes.map((item) => item.name).join(", ")}.`);
      }
    }
  }
  if (!citations.length) return { type: "not_found", source: "dining", note: `No matching service or menu items. The demo menus cover ${dining.menu_start} through ${dining.menu_end}.` } as const;
  const visible = citations.slice(0, 9);
  const suffix = citations.length > visible.length ? "\n\nAsk about a specific venue, date, or meal to narrow the results." : "";
  return reply(visible.map((citation) => citation.passage).join("\n\n") + suffix, visible);
}

export function campusReply(question: string): AssistantReply | null {
  const q = question.toLowerCase().replace(/’/g, "'");
  const dates = datesFor(q);
  if (!dates.length) return { type: "error", message: "That date does not exist. Try a real date like 2026-11-09 or November 9." };
  if (/allerg|cross.contact|celiac|gluten.free/.test(q)) return housingReply("18.3");
  const contact = contacts(q);
  if (contact) return contact;
  if (calendar.events.some((event) => q.includes(event.title.toLowerCase())) || /\b(event|events|rsvp|what's happening|what is happening|things to do)\b/.test(q)) return eventAnswer(q, dates);
  const section = Object.entries(rules).find(([, rule]) => rule.test(q));
  if (section) return housingReply(section[0]);
  if (/\b(dining|food|eat|breakfast|what's open|open (now|today|tonight|tomorrow)|lunch|dinner|menu|vegan|vegetarian|halal|open after)\b/.test(q) || dining.venues.some((v) => q.includes(v.name.toLowerCase()))) return diningAnswer(q, dates);
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|thanks|thank you)( there| again)?[!?. ]*$/.test(q)) return { type: "chat", text: "Ask me about Grand River housing, dining, events, or campus contacts." };
  return null;
}
