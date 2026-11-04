# Deploy as a new project

1. Extract the archive into a fresh folder and run the local checks in README.md.
2. Create a new GitHub repository. Initialize Git from the folder with package.json, review the staged files, commit, and push to that repository.
3. Import the new repository as a separate Vercel project. Use the Next.js framework preset, repository root, and Node.js 24.x. Use the normal npm install and build defaults.
4. Leave the environment variables unset for the initial no-key launch.
5. Open the preview URL in a browser. Check the three starter prompts, a handbook PDF page link, the hall picker, and the help sheet. On Vercel the ask endpoint requires same-origin browser requests, so run the preview check in the browser.
6. Use the URL assigned to the new Vercel project or add a custom domain you control when ready.

The default setup serves the bundled fixture data. A hosted database or cron schedule is unnecessary. A production build was checked locally. Vercel provisioning, optional preview-domain BotID, and custom domain setup require the new project.

## Optional model mode

Set `GRU_ENABLE_MODEL=1` and a fresh server-only `ANTHROPIC_API_KEY` if you choose to use the model-backed path. The safety classifier runs before routing; housing questions that miss the local rules can use the model with the Grand River handbook. This sends the question and limited conversation context to the provider.

Configure shared Redis and a stable IP hash salt before publicly enabling paid model mode. See .env.example. The inherited budget counter is an application-level estimate. Set a provider-side spending limit independently. Keep the optional provider integration disabled until you have verified a cited model answer, classifier failure behavior and the rate-limit store in the new environment.

To opt into BotID on Vercel, enable the project’s BotID and OIDC integration and set `NEXT_PUBLIC_GRU_ENABLE_BOTID=1` before rebuilding. Verify a normal browser request on the new preview domain. Local development and local production builds bypass the Vercel-only check.
