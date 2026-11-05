// ─────────────────────────────────────────────────────────────────────────────
// GUARDRAIL #2: HARDCODED ESCALATION (layer 1 of 2: keywords)
//
// Some topics must never reach the AI's answer step: self-harm, suicide,
// abuse, immediate safety threats, conduct violations and roommate conflict.
// Every message goes through two checks before anything else:
//   1. These keyword rules (instant, no AI, also run in the browser).
//   2. A separate safety-classifier call (lib/safety.ts) that catches
//      paraphrased distress the keywords miss, and fails closed.
// If either fires, the resident sees a fixed screen from SCREENS below with
// real people to contact and click-to-call buttons. Nothing the model says can
// change these screens.
//
// Plain policy questions ("what counts as harassment?", "what is a roommate
// agreement?") are not escalated; they get a normal cited answer.
//
// ⚠️  Changes to this file should be reviewed by REHS staff. Run
//     `npm run test:escalation` after every edit.
// ─────────────────────────────────────────────────────────────────────────────

export type EscalationCategory =
  | "crisis" // self-harm, suicide, distress
  | "safety" // immediate danger, emergencies
  | "abuse" // abuse, assault, harassment or stalking happening to someone
  | "conduct" // the resident's own conduct incident or write-up
  | "roommate" // roommate or suitemate conflict
  | "general"; // the safety classifier flagged it, or it failed (fail closed), or "Get help now"

// ── Contact resources ───────────────────────────────────────────────────────
export type SimulatedLine = { label: string; number: string };
export type Resource = {
  name: string;
  detail: string;
  phone?: string;
  sms?: string;
  actionLabel?: string;
  raLookup?: boolean;
  /** Fictional, non-dialable placeholders. Rendered as plain text, never as tel: links. */
  lines?: SimulatedLine[];
};
export const RESOURCES = {
  emergency: {
    name: "Real-world emergency",
    detail: "If anyone is in immediate danger, contact your local emergency services.",
    lines: [
      { label: "GRU Police Dispatch (24/7)", number: "XXX-6720-8900" },
      { label: "Simulated emergency services", number: "XXX-0100-0911" },
      { label: "Residential Duty (after hours)", number: "XXX-6720-8902" },
    ],
  },
  support: {
    name: "Real-world support",
    detail: "Reach out to someone you trust or your actual university's support office.",
    lines: [
      { label: "Wellness Center (counseling)", number: "XXX-6720-8905" },
      { label: "Student Care (crisis and hardship)", number: "XXX-6720-8906" },
      { label: "Simulated crisis line (24/7, call)", number: "XXX-0100-0988" },
      { label: "Simulated crisis text line", number: "XXX-0100-0741" },
    ],
  },
  raOnDuty: { name: "Simulated residential contacts", detail: "For demo purposes only. These fictional numbers cannot be called.", raLookup: true },
} satisfies Record<string, Resource>;
export const ALWAYS_SHOWN: Resource[] = [RESOURCES.emergency, RESOURCES.support];

// ── The fixed screens ───────────────────────────────────────────────────────

export type EscalationScreen = {
  title: string;
  message: string;
  resources: Resource[]; // shown first; ALWAYS_SHOWN is added below them
};

export const SCREENS: Record<EscalationCategory, EscalationScreen> = {
  crisis: {
    title: "You don't have to handle this alone",
    message:
      "This is something a real person should help with, right now. If you are in immediate danger, contact your local emergency services.",
    resources: [RESOURCES.support],
  },
  safety: {
    title: "Get help from a person now",
    message: "If you or someone else is in danger, don't wait on a chatbot. Contact one of these right away.",
    resources: [RESOURCES.emergency],
  },
  abuse: {
    title: "You deserve support from a real person",
    message:
      "What you're describing should be handled by trained people, not an automated assistant. You can reach out confidentially.",
    resources: [RESOURCES.support],
  },
  conduct: {
    title: "Talk to hall staff about this",
    message:
      "Questions about a specific incident or conduct case need a person who can look at your situation. Your RA or hall staff can walk you through what happens next.",
    resources: [RESOURCES.raOnDuty],
  },
  roommate: {
    title: "Your RA can help with this",
    message:
      "Roommate situations are exactly what RAs are trained for. They can help you talk it through, set up a roommate agreement, and figure out next steps.",
    resources: [RESOURCES.raOnDuty],
  },
  general: {
    title: "Let's get you to a person",
    message:
      "This sounds like something a real person should help with. Use real-world support if this is happening now.",
    resources: [RESOURCES.support],
  },
};

// ── The trigger rules ───────────────────────────────────────────────────────
// Each rule is a regular expression tested against a NORMALIZED copy of the
// question: lowercase, apostrophes removed ("don't" → "dont"), all other
// punctuation turned into spaces. Write patterns in that form.
//
// Checked in order, first match wins: crisis → safety → abuse → conduct → roommate.

const RULES: Record<Exclude<EscalationCategory, "general">, RegExp[]> = {
  crisis: [
    /\bsuicid/, // suicide, suicidal
    /\bkill(ing|ed)? (my ?self|myself|him ?self|her ?self|them ?selves|them ?self)\b/,
    /\bkms\b/,
    /\bunalive/,
    /\bend(ing)? (my|their|his|her|it) (life|all)\b/,
    /\b(want|wanna|going|gonna) (to )?die\b/,
    /\bdont want to (live|be alive|be here|exist)/,
    /\bno reason to live\b/,
    /\bbetter off dead\b/,
    /\bself ?harm/,
    /\b(hurt|hurting|cut|cutting|harm|harming) (my ?self|myself)\b/,
    /\boverdos/,
    // Low mood and distress said plainly ("I am sad", "feeling hopeless").
    /\b(i am|im|i feel|i felt|feel|feeling|ive been|i have been|been feeling|i just feel|im feeling|i am feeling) (so |really |very |just |kinda |kind of |a little |pretty |extremely |super |always |constantly )?(sad|depressed|hopeless|lonely|alone|anxious|overwhelmed|worthless|miserable|empty|numb|broken|helpless|trapped|stressed out|not ok|not okay|unhappy|invisible|defeated|a failure|a burden|a mess|a waste|not doing (well|ok|okay|good|great))\b/,
    /\b(i feel|feeling|felt|ive been feeling) (so |really |very |completely |totally |kind of )?(lost|low|terrified|scared|afraid|stuck|disconnected|dead inside)\b/,
    /\b(i am|im) (terrified|so scared|really scared)[!. ]*$/,
    /\b(i am|im|i feel|feeling|ive been) (so |really |very |just )?(down|alone|all alone)( lately| today| right now| again)?$/,
    /\b(depressed|depression|panic attacks?|anxiety attacks?|breakdown|crying a lot|cant stop crying)\b/,
    /\b(cant|can not|cannot) (do this|go on|take (it|this)|cope|handle (it|this|anything))( anymore| any more)?\b/,
    /\b(nothing matters|whats the point|no point (in|to) anything|giving up|give up on (life|everything))\b/,
    /\bno one (cares|likes me|would (notice|miss me))\b/,
    /\bnobody (cares|likes me|would (notice|miss me))\b/,
    /\b(hate|hating) (my ?self|myself|my life)\b/,
    // Dying, said about the speaker. Escalates unless it is plainly an idiom ("dying to try the tacos").
    /\b(i am|im|i feel like (i am|im)|i think (i am|im)|i might be|i may be|i feel like i might be|am) (dying|going to die|gonna die)\b(?! (laughing|of laughter|of embarrassment|to |for |from laughing|inside from))/,
    /\bi (might|may|could|will|think i will|feel like i will) die\b/,
    /\b(wish|wished) (i|that i) (was|were) (dead|gone|never born)\b/,
    /\bi dont (want|wanna) to (be here|be around|wake up|go on)\b/,
    /\b(my )?(anxiety|depression|panic) (is|has been|keeps|feels)\b/,
    /\b(i )?(have|ve got|got) (no|zero) (friends|one|body)\b|\bi have nobody\b/,
    /\b(feel|feeling|felt|am|im) (like )?(a |such a )?(failure|loser|burden|waste|mess|nobody)\b/,
    /\b(im|i am|i have been|ive been) (really |so |just )?struggling( right now| lately| a lot)?[!. ]*$/,
    /\bi hate (being|living) (here|alive)\b/,
    /\b(i am|im) (so |really |very )?(stressed|overwhelmed|anxious|exhausted)\b.*\bcant\b/,
    /\bcant (sleep|get out of bed|focus|function|think straight)\b.*\b(anxious|stress|sad|depress|alone|hopeless|everything)\b/,
    /\b(i give up|i gave up|want to give up|ready to give up)\b/,
    /\b(what is|whats) the point( of (anything|it all|living|life|trying))?\b/,
    /\b(life|everything|it all) (is|feels|seems) (pointless|meaningless|hopeless|too much|a mess|falling apart|over)\b/,
    /\b(my life is a mess|falling apart|fell apart|breaking point|rock bottom)\b/,
    /\b(losing my mind|going crazy|im crazy)\b/,
    /\bcant stop (shaking|crying|panicking|thinking about)\b/,
    /\b(crying|cried) (all|every|for)\b/,
    /\b(burden|waste of space)\b/,
    /\bi dont (matter|belong)\b|\bdont belong anywhere\b|\balone forever\b|\bfeel(ing)? invisible\b/,
    /\b(wish|wished) (i|that i) (could (just )?disappear|wasnt (here|alive|born)|could (just )?vanish)\b/,
    /\b(think|thinking|thought|thoughts) (about|of) (ending|dying|death|killing|suicide|hurting)\b/,
    /\bending (it|everything|my life)\b|\bend it all\b/,
    /\bi (have been|ve been|am|was) cutting\b/,
    /\b(took|taken|swallowed) (too many|a bunch of|a lot of|a handful of|all my|all the) (pills|meds|tablets|medication)\b/,
    /\b(no|dont see a|cant see a) way out\b|\bcant see a future\b|\bnothing to live for\b|\bnot worth living\b|\b(isnt|not) worth (it|living)\b/,
    /\bdone with (everything|life|it all|living)\b/,
    /\bwant (it|everything|this|the pain) (all )?to stop\b|\bcant (stand|bear|take) the pain\b|\bsleep forever\b/,
    /\b(so |really )?(tired|sick) of (everything|living|life|being alive|it all|trying)\b/,
    /\bdont know what to do (anymore|any more)\b|\bcant keep (doing this|living|going|pretending)\b/,
    /^(im|i am) (so )?done[!. ]*$/,
    /\b(run|get) away from everything\b|\bfeel like ending\b/,
    /\btell me (its|it will be|everything will be|its going to be) ok(ay)?\b/,
    /\b(scared|afraid) (of|that i might hurt) my ?self\b|\bdont trust my ?self\b|\bmight hurt my ?self\b/,
    /\bneed (someone|somebody) to talk\b|\bneed to talk to (someone|somebody)\b|\bsomeone to talk to\b|\bcan (someone|somebody) (please )?talk to me\b/,
    /^(please )?(help me|i need help)( please)?[!. ]*$|^please help\b/,
    /\b(want|wanna|wish|need) to disappear\b/,
    /\b(everyone|everybody|the world|they) would be better (off )?without me\b/,
  ],
  safety: [
    /\b(this is|its|having|have|theres|there is) an emergency\b/, // not "emergency lock change"
    /^(emergency|help)\b/,
    /\b(in danger|not safe|unsafe|scared for my life)\b/,
    /\b(someone|somebody|guy|man|woman|person|people|student|he|she|they|roommate|neighbor)\b.*\b(has|had|is holding|holding|pulled( out)?|with|carrying|waving|pointed|pointing) an? (gun|knife|weapon|firearm)/,
    /\b(shooter|shooting|gunshot|shots fired)\b/,
    /\b(threatened|threatening) (me|us|to (kill|hurt|shoot|stab))/,
    /\b(theres|there is|i see|i smell|smells like) (a )?(fire|smoke|gas)\b(?! (drill|safety|door|code|policy|rule))/,
    /\bgas leak\b/,
    /\bon fire\b/,
    /\b((not|isnt|stopped) breathing|unconscious|unresponsive|passed out|wont wake up|seizure|bleeding)\b/,
    /\balcohol poisoning\b/,
    /\b(cant|cannot|can not|hard to|trouble|struggling to) breathe?\b/,
    /\b(chest pain|heart attack|having a stroke|anaphyla)/,
    /\b(allergic reaction|throat is closing|throat closing)\b/,
    /\b(broke|breaking|broken) into\b/,
    /\b(following|followed) me\b/,
    /\b(banging|pounding) on (my|our|the) door\b/,
    /\btrying to (get|break) in(to)?\b/,
    /\b(dont|do not|doesnt|not) feel safe\b/,
  ],
  abuse: [
    // Something happening to a person, not a question about the policy.
    /\b(abused|abusing|abusive)\b/,
    /\babuse (me|us|my|her|him|them)\b/,
    /\b(assaulted|assaulting|sexual assault|sexually assault)/,
    /\brap(e|ed|ing)\b/,
    /\bmolest/,
    /\b(harassing|harassed|harasses|stalking|stalked|stalks) (me|us|my|her|him|them)\b/,
    /\bbeing (harassed|stalked|abused|bullied|threatened)\b/,
    /\b(domestic|dating|relationship) violence\b/,
    /\b(hit|hits|hitting|punched|slapped|choked|shoved|pushed|grabbed) me\b/,
    /\btouched me\b/,
    /\bcoerc/,
    /\bgrooming me\b/,
    /\bhazing\b/,
    /\bnon ?consensual\b/,
    /\b(afraid|scared|terrified) of (my|him|her|them|their)\b/,
    /\b(blackmail|sextort)/,
    /\bbull(y|ies|ying) (me|us)\b/,
    /\bwithout (my )?consent\b/,
  ],
  conduct: [
    /\b(written|write|wrote) (me )?up\b/,
    /\bgot (a )?write ?up\b/,
    /\bincident report\b/,
    /\bconduct (hearing|meeting|case|violation|letter|charge)/,
    /\b(i|we|my roommate) (got|was|were|have been|been) (caught|documented|reported|cited|written)\b/,
    /\b(caught|documented) (me|us)\b/,
    /\b(police|cops|ra) (caught|found|documented|reported) (me|us)\b/,
    /\bgetting (kicked|thrown) out\b/,
    /\b(kicked|thrown) out of (housing|the hall|my room|the dorm)/,
    /\bappeal (my|a|the) (sanction|decision|removal)/,
    /\binterim removal\b/,
  ],
  roommate: [
    // "roommate" or "suitemate" together with a sign of conflict.
    /\b(room|suite) ?mates?\b.*\b(conflict|fight|fighting|argu|problem|issue|hate|cant stand|annoying|disrespect|rude|mean to me|messy|dirty|steal|stole|stealing|won ?t|wont|keeps|always|never|lock(s|ed)? me out|sexile|kick(ed|ing)? me out|get along|not getting along|mad at|yell|scream|uncomfortable|drama|toxic|bully|bullying|pressur)/,
    /\b(conflict|fight|fighting|argu|problem|issue|drama|not getting along|dont get along|cant stand|hate) .*\b(room|suite) ?mates?\b/,
    /\bnew roommate because\b/,
    /\bcant (live|stay|sleep) (with|in)\b.*\b(room|suite) ?mate/,
  ],
};

const ORDER = ["crisis", "safety", "abuse", "conduct", "roommate"] as const;

/** Lowercase, drop apostrophes, and replace other punctuation with spaces. */
export function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’'`]/g, "") // don't → dont
    .replace(/[^a-z0-9]+/g, " ") // punctuation → space
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns the escalation category for a question, or null if it is fine to
 * send to the assistant. Plain pattern matching, no AI.
 */
export function checkEscalation(question: string): EscalationCategory | null {
  for (const text of evasionVariants(question)) {
    for (const category of ORDER) {
      if (RULES[category].some((rule) => rule.test(text))) return category;
    }
  }
  return null;
}

// Look-alike letters people use to slip past filters (Greek and Cyrillic capitals, leetspeak digits).
const LOOKALIKES: Record<string, string> = {
  "κ": "k", "ι": "i", "ο": "o", "а": "a", "е": "e", "о": "o", "і": "i", "р": "p", "с": "c", "ѕ": "s",
  "@": "a", "$": "s",
};
const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t" };

/** The normalized question plus de-obfuscated copies: "k i l l", "k.i.l.l", "d1e", "ΚΙLL". */
function evasionVariants(question: string): string[] {
  const base = question.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f\u200b-\u200d\u00ad]/g, "");
  const swapped = [...base].map((ch) => LOOKALIKES[ch] ?? ch).join("");
  const leet = swapped.replace(/[a-z0-9]*[a-z][a-z0-9]*/g, (word) => (/\d/.test(word) ? word.replace(/[013457]/g, (d) => LEET[d] ?? d) : word));
  const out = new Set<string>();
  for (const v of [base, swapped, leet]) {
    const n = normalizeQuestion(v);
    out.add(n);
    out.add(n.replace(/\b(?:[a-z] ){2,}[a-z]\b/g, (run) => run.replace(/ /g, ""))); // "k i l l" -> "kill"
  }
  return [...out];
}

/**
 * Safety net for messages that match no campus topic: the speaker is talking about their own
 * feelings or situation ("I feel...", "I can't...", "I need someone..."). Errs toward showing help.
 */
export function looksPersonal(question: string): boolean {
  const text = normalizeQuestion(question);
  return (
    /\b(i|im|ive|id|my|me|myself|everything)\b/.test(text) &&
    /\b(sad|upset|anxious|hopeless|worthless|lonely|alone|exhausted|overwhelm\w*|drown\w*|suffocat\w*|struggl\w*|crying|cry|hurts?|hurting|pain|scared of|afraid of|ashamed|awful|terrible|horrible|heavy|miserable|scared about|so scared|sick of (all|it)|dont feel (okay|ok|good|right|well|safe)|stress\w* out|so stressed|worried about myself|cant (cope|go on|do this|take|handle|stop|sleep|breathe|eat anything)|dont know (what to do|if i can)|wish (i|that i)|hate (my ?self|my life|this|everything|how i feel)|need (someone|to talk))\b/.test(text)
  );
}
