import { initBotId } from "botid/client/core";

if (process.env.NEXT_PUBLIC_GRU_ENABLE_BOTID === "1") initBotId({ protect: [
  { path: "/api/ask", method: "POST" },
  { path: "/api/feedback", method: "POST" },
  { path: "/api/escalation-log", method: "POST" },
] });
