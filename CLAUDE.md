# Claude Code handoff

This folder contains a working Next.js application. Start with README.md, docs/PROJECT_BRIEF.md, docs/ARCHITECTURE.md, and docs/DEPLOYMENT.md. Run npm ci, npm test, npm run typecheck, and npm run build before changing behavior.

Preserve the existing interaction patterns: a single chat, clickable handbook citations, named campus records, a hall picker, feedback, and a permanent help entry point. Preserve fictional branding and non-dialable placeholders across all campus data. Keep the fixed demo clock aligned with the dated fixtures. Route out-of-coverage dates to a plain no-data response. Keep allergy questions grounded in the handbook's ingredient-verification policy.

The primary release is the deterministic no-key demo. Optional model mode preserves a separate fail-closed classifier and cited housing fallback. Never enable it implicitly. Avoid logging chat text or forwarding fictional campus numbers as real help. Keep feedback and escalation logs free of message content. Run the tests after changing routing, citations, or dates.

The owner plans to create a fresh GitHub repository and Vercel project. Wait for the owner to supply their targets before linking, pushing, or deploying. The archive already includes every file needed for the first local run.
