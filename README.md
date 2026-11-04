# Ask Grand River

A Next.js campus-life assistant for **Grand River University**, a fictional college. It answers questions about the resident handbook, three dining venues, campus events and seven residences.

## Run locally

Use Node.js 24 and npm. Unzip the project, open a terminal in the folder containing `package.json`, and run:

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). The default app reads local JSON and needs no environment file, API key, database service, or prior deployment. After dependencies are installed, local answers work offline.

Try these:

| Ask | Expected |
|---|---|
| Can I bring a mini fridge? | 3.8 cubic feet, with a link to handbook page 10 |
| What's open after 9 tonight? | Stonebridge Kitchen closes at 23:30 on the demo date |
| Is Maple Market open on 2026-11-11? | Closed for maintenance |
| Any free events this weekend? | Events on November 7–8 |
| Was Courtyard Astronomy cancelled? | Cancelled because equipment is unavailable |
| What is the RA phone number in Juniper Hall? | Juniper contact card with fictional numbers |

The UI and API use **November 4, 2026** as the reference date. Menu coverage is November 2–15. Event coverage is November 4–15. Displayed times use Eastern Time.

```sh
npm test
npm run typecheck
npm run build
npm start
```

## Handoff

- [CLAUDE.md](CLAUDE.md) gives the coding agent its operating brief.
- [Project brief](docs/PROJECT_BRIEF.md) describes the product and scope.
- [Architecture and data](docs/ARCHITECTURE.md) maps source files and behavior.
- [Deployment](docs/DEPLOYMENT.md) covers a fresh GitHub repository and Vercel project.
- [Resident handbook](docs/RESIDENT_HANDBOOK.md) contains the editable housing policy text. [PDF](public/handbook.pdf)
- [Verification](docs/VERIFICATION.md) records test coverage and limits.
