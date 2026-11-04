"use client";

// Sample maintenance request: five quick steps (hall, floor, room, issue, name),
// then a confirmation. Everything stays in this component; nothing is sent
// anywhere, and the photo box is a non-working sample.

import { useEffect, useRef, useState } from "react";
import { HALLS } from "@/lib/halls";
import { FLOORS, ISSUES, PRIORITY_COPY, SAMPLE_NAMES, roomsOnFloor, sampleReference } from "@/lib/maintenance";
import { CloseIcon } from "./Icons";

type Answers = { hall?: string; floor?: number; room?: string; issue?: string; name?: string };
const STEPS = ["Which hall?", "Which floor?", "Which room?", "What's the issue?", "Your name"] as const;

export default function MaintenanceSheet({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>({});
  const [photoNote, setPhotoNote] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    sheetRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const hall = HALLS.find((h) => h.id === a.hall);
  const issue = ISSUES.find((i) => i.id === a.issue);
  const canNext = [a.hall, a.floor, a.room, a.issue, a.name][step] !== undefined;
  const done = reference !== null;

  function next() {
    if (!canNext) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else setReference(sampleReference());
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        ref={sheetRef}
        className="sheet mx"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mx-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-head">
          <h2 id="mx-title">{done ? "Request submitted" : "Maintenance request"}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon size={20} />
          </button>
        </div>

        {!done && (
          <>
            <p className="mx-sample">Sample form · fictional data · nothing is sent</p>
            <div className="mx-progress" aria-hidden="true">
              {STEPS.map((_, i) => <span key={i} className={i <= step ? "on" : ""} />)}
            </div>
            <p className="mx-step">Question {step + 1} of {STEPS.length}</p>
            <h3 className="mx-q">{STEPS[step]}</h3>

            {step === 0 && (
              <div className="mx-options" role="radiogroup" aria-label="Hall">
                {HALLS.map((h) => (
                  <Option key={h.id} selected={a.hall === h.id} onClick={() => setA({ ...a, hall: h.id })}>
                    {h.name}
                  </Option>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="mx-options three" role="radiogroup" aria-label="Floor">
                {FLOORS.map((f) => (
                  <Option key={f} selected={a.floor === f} onClick={() => setA({ ...a, floor: f, room: undefined })}>
                    Floor {f}
                  </Option>
                ))}
              </div>
            )}

            {step === 2 && a.floor !== undefined && (
              <div className="mx-options rooms" role="radiogroup" aria-label="Room">
                {roomsOnFloor(a.floor).map((r) => (
                  <Option key={r} selected={a.room === r} onClick={() => setA({ ...a, room: r })}>
                    {r}
                  </Option>
                ))}
              </div>
            )}

            {step === 3 && (
              <>
                <label className="mx-label" htmlFor="mx-issue">Issue</label>
                <select
                  id="mx-issue"
                  className="mx-select"
                  value={a.issue ?? ""}
                  onChange={(e) => setA({ ...a, issue: e.target.value || undefined })}
                >
                  <option value="" disabled>Choose the issue…</option>
                  {ISSUES.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
                </select>

                <span className="mx-label">Photo (optional)</span>
                <button type="button" className="mx-drop" onClick={() => setPhotoNote(true)}>
                  <strong>Add a photo</strong>
                  <span>Sample only. Photo uploads are turned off in this demo.</span>
                </button>
                {photoNote && <p className="mx-note" role="status">This is a sample photo box, so no photo was added.</p>}
                <p className="mx-note">Flooding, a gas smell, or anything unsafe? Close this and use <strong>Get help</strong>.</p>
              </>
            )}

            {step === 4 && (
              <div className="mx-options" role="radiogroup" aria-label="Sample name">
                {SAMPLE_NAMES.map((n) => (
                  <Option key={n} selected={a.name === n} onClick={() => setA({ ...a, name: n })}>
                    {n}
                  </Option>
                ))}
              </div>
            )}

            <div className="mx-nav">
              {step > 0 && <button className="back" onClick={() => setStep(step - 1)}>Back</button>}
              <button className="mx-next" disabled={!canNext} onClick={next}>
                {step === STEPS.length - 1 ? "Submit request" : "Next"}
              </button>
            </div>
          </>
        )}

        {done && hall && issue && (
          <div className="mx-done" role="status">
            <p className="mx-check" aria-hidden="true">✓</p>
            <p>Thanks, {a.name}. Your request has been submitted.</p>
            <dl className="mx-summary">
              <div><dt>Reference</dt><dd>{reference} <small>(sample)</small></dd></div>
              <div><dt>Location</dt><dd>{hall.name}, room {a.room}</dd></div>
              <div><dt>Issue</dt><dd>{issue.label}</dd></div>
              <div><dt>Priority</dt><dd>{PRIORITY_COPY[issue.priority].label}</dd></div>
            </dl>
            <p className="sheet-message">
              {PRIORITY_COPY[issue.priority].detail} Facilities reviews every request and takes the most urgent repairs first.
            </p>
            <p className="mx-sample">Demo only: no request was actually sent.</p>
            <button className="mx-next" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Option({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={selected} className={`mx-opt${selected ? " on" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}
