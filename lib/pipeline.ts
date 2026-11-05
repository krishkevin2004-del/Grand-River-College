import { answerQuestion } from "./answer";
import { CONFIG } from "./config";
import { campusReply } from "./demo";
import { checkEscalation, looksPersonal } from "./escalation";
import { isRaContactRequest, matchHall } from "./halls";
import { checkLimits } from "./limits";
import { classifySafety } from "./safety";
import type { AssistantReply, HistoryTurn } from "./types";

export async function askHandbook(
  rawQuestion: string,
  options: { ip?: string; history?: HistoryTurn[] } = {},
): Promise<AssistantReply> {
  const question = rawQuestion.trim();
  if (!question) return { type: "error", message: "Type a question first." };
  if (question.length > CONFIG.maxQuestionLength) return { type: "error", message: "Please keep questions under 500 characters." };
  const keyword = checkEscalation(question);
  if (keyword) return { type: "escalate", category: keyword, layer: "keyword" };

  if (options.ip) {
    const limit = await checkLimits(options.ip);
    if (limit !== "ok") return { type: "rate_limited", reason: limit === "visitor_limit" ? "visitor" : limit === "site_busy" ? "busy" : "budget" };
  }

  const history = options.history ?? [];
  const modelEnabled = process.env.GRU_ENABLE_MODEL === "1";
  if (modelEnabled) {
    const previous = history.findLast((turn) => turn.role === "user")?.text;
    const safety = await classifySafety(question, previous);
    if (safety.label !== "safe") return { type: "escalate", category: "general", layer: safety.failedClosed ? "fail_closed" : "classifier" };
  }
  if (isRaContactRequest(question)) return { type: "ra_lookup", hallId: matchHall(question)?.id };
  const answer = campusReply(question);
  if (answer) return answer;
  // Nothing campus-related matched. A personal, emotional message goes to people, never to "out of scope".
  if (looksPersonal(question)) return { type: "escalate", category: "general", layer: "keyword" };
  if (modelEnabled) {
    const result = await answerQuestion(question, history);
    return result.type === "ra_lookup" ? { ...result, hallId: matchHall(question)?.id } : result;
  }
  if (/\b(hall|housing|room|residence|dorm)\b/i.test(question)) return { type: "not_found" };
  return { type: "off_topic" };
}
