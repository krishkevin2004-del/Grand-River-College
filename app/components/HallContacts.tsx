"use client";

// "Which hall are you in?" picker and the contact card for that hall.
// All numbers come from data/hall-contacts.json, never from the AI.

import { HALLS, NEIGHBORHOODS, RESIDENTIAL_DUTY, type Hall } from "@/lib/halls";

export function HallPicker({ onPick }: { onPick: (hall: Hall) => void }) {
  return (
    <div className="hall-picker">
      <select
        aria-label="Choose your hall"
        defaultValue=""
        onChange={(e) => {
          const hall = HALLS.find((h) => h.id === e.target.value);
          if (hall) onPick(hall);
        }}
      >
        <option value="" disabled>
          Choose your hall…
        </option>
        {NEIGHBORHOODS.map((n) => (
          <optgroup key={n} label={n}>
            {HALLS.filter((h) => h.district === n).map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

export function HallContactCard({ hall }: { hall: Hall }) {
  return (
    <div className="hall-card">
      <strong>{hall.name}</strong>
      <p className="hours">Fictional contacts · numbers are non-dialable</p>
      <p>Hall desk: {hall.desk_phone}</p>
      <p>Weekdays 08:00–22:00 · weekends 10:00–20:00</p>
      <p>Residential duty outside desk hours: {RESIDENTIAL_DUTY.phone}</p>
    </div>
  );
}
