// POST /api/feedback  { vote: "up" | "down" }
//
// Thumbs up/down on an answer. Anonymous: we log the vote only. The
// question and answer text are excluded.

import { allowCheapRequest } from "@/lib/limits";
import { guardRequest } from "@/lib/requestGuard";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const guard = await guardRequest(request);
  if (!guard.ok) return guard.response;
  if (!(await allowCheapRequest(guard.ip))) return new Response(null, { status: 429 });

  const body = guard.body as { vote?: unknown } | null;
  const vote = body?.vote === "up" || body?.vote === "down" ? body.vote : null;
  if (!vote) return new Response(null, { status: 400 });
  console.log(JSON.stringify({ event: "feedback", vote }));
  return new Response(null, { status: 204 });
}
