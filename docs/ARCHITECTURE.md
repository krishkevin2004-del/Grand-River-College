# Architecture and data

## How the source application worked

The original archive was a Next.js App Router project. The browser called a single ask endpoint. The backend checked keyword escalation, rate limits, and a fail-closed model classifier before routing into hall contacts, handbook, dining, or events. Housing used the Claude citations API over a precomputed handbook index. Dining and events were designed around scheduled ingestion and cached external records. The UI had a separate help sheet and a hall picker.

## How this build works

- `app/components/Chat.tsx` retains the original chat interaction and holds conversation history in the active tab.
- `app/api/ask/route.ts` guards and validates requests and returns the shared reply shape.
- `lib/pipeline.ts` runs keyword escalation first, checks limits, and routes the request.
- `lib/demo.ts` serves deterministic policy, dining, event, and directory results from the packaged data. It supports common question patterns and explicit dates. Some paraphrases and follow-ups may require rephrasing as standalone questions.
- `lib/answer.ts` and `lib/safety.ts` provide optional Claude housing fallback and a separate fail-closed classifier. The no-key mode has only keyword-based escalation. Neither mode is an emergency service.
- `lib/limits.ts` retains the rate-limit counters. Shared Redis is optional for the no-key simulation. Browser help remains independent of the ask endpoint.

## Data map

| File | Contents |
|---|---|
| `data/housing_policies.json` | Canonical chapters and section text |
| `data/handbook-index.json` | Citable chunks with PDF pages. Chapter NN starts on page NN + 2. |
| `public/handbook.pdf` | Published fictional handbook used by citation links |
| `data/campus_directory.json` | Residence hall IDs, districts, desks, office contacts |
| `data/dining.json` | Venue-to-hall IDs, dated menus, menu-to-item IDs and dated overrides |
| `data/events.json` | Stable event IDs, date ranges and cancellation or rescheduling metadata |

Menus and event records are bundled fixtures. Six generic dish names came from the original dining test sample. Their Grand River schedule, venue, and recipe metadata are fictional. No legacy campus feeds, contact numbers, brands, environment files, or provider IDs are required. A null allergen field means unknown and a recorded list cannot establish safety. When changing policies, update JSON, the handbook index, the editable Markdown, and the PDF together.
