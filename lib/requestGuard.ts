// ─────────────────────────────────────────────────────────────────────────────
// First line of defense for every API route. Rejects a request before it can
// cost anything if:
//   - it's bigger than a normal question (someone stuffing huge payloads),
//   - it didn't come from this website's own page (a script calling the API
//     directly; production only),
//   - Vercel BotID says it's automated (a bot or headless browser).
// Also gives the visitor's IP address as Vercel sees it, which can't be faked
// with a made-up header.
// ─────────────────────────────────────────────────────────────────────────────

import { ipAddress } from "@vercel/functions";
import { checkBotId } from "botid/server";

const MAX_BODY_BYTES = 8_000; // a 500-character question plus short history fits easily

type Guarded = { ok: true; ip: string; body: unknown } | { ok: false; response: Response };

export async function guardRequest(request: Request): Promise<Guarded> {
  const isProduction = process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview";

  // 1. Same site only. Browsers mark requests from our own page as "same-origin".
  if (isProduction && request.headers.get("sec-fetch-site") !== "same-origin") {
    return { ok: false, response: new Response(null, { status: 403 }) };
  }

  // BotID requires a Vercel request context. The fixture demo can run locally.
  if (isProduction && process.env.NEXT_PUBLIC_GRU_ENABLE_BOTID === "1") {
    try {
      const verification = await checkBotId();
      if (verification.isBot) return { ok: false, response: new Response(null, { status: 403 }) };
    } catch {
      return { ok: false, response: new Response(null, { status: 503 }) };
    }
  }

  // 3. Size. Read at most MAX_BODY_BYTES.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return { ok: false, response: new Response(null, { status: 413 }) };
  const reader = request.body?.getReader();
  if (!reader) return { ok: false, response: new Response(null, { status: 400 }) };
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => {});
        return { ok: false, response: new Response(null, { status: 413 }) };
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch {
    return { ok: false, response: new Response(null, { status: 400 }) };
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, response: new Response(null, { status: 400 }) };
  }

  // Vercel's own record of the caller's IP. Falls back to headers on your laptop.
  const ip =
    ipAddress(request) ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "local";

  return { ok: true, ip, body };
}
