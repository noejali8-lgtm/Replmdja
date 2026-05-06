# Replit IDE Workspace Clone

A mobile-first Replit clone with two apps: **App Builder** (mobile UI matching the Replit app) and **Replit IDE** (full workspace with editor, projects, and extensions store).

## Run & Operate

- `pnpm install` — install all dependencies
- `pnpm run typecheck` — typecheck all packages
- `pnpm run build` — build all packages
- API Server: `PORT=8080 pnpm --filter @workspace/api-server run dev`
- App Builder: `PORT=20311 BASE_PATH=/ pnpm --filter @workspace/app-builder run dev`
- DB push: `pnpm --filter @workspace/db run push`
- Required env vars: `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`, `AI_INTEGRATIONS_ANTHROPIC_API_KEY` (auto-provisioned via Replit AI integration), `DATABASE_URL`

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24, **TypeScript**: 5.9
- **Frontend**: React 19 + Vite 7 + Tailwind CSS 4
- **Routing**: Wouter
- **Animations**: Framer Motion
- **API**: Express 5 + Drizzle ORM + PostgreSQL
- **AI**: Anthropic Claude (streaming + tool use for GitHub/URL browsing)

## Where Things Live

- `artifacts/replit-ide/` — Full IDE workspace (home, editor, projects, profile, extensions store)
- `artifacts/app-builder/` — Mobile Replit app clone (home, chat, projects, account)
- `artifacts/api-server/` — Express API with Anthropic AI streaming + tool-use agentic loop
- `lib/api-zod/`, `lib/api-spec/`, `lib/db/` — shared libs

## Architecture Decisions

- Both frontend apps share the same pnpm workspace catalog for version-locked dependencies
- Editor uses in-browser Babel + React UMD for live preview without a build step
- AI chat streams via SSE (`data: {...}` lines) from the Express API
- **Agentic tool-use loop**: API uses non-streaming `anthropic.messages.create` first; if model calls `fetch_url` tool, server fetches GitHub/URL and sends `tool_call` SSE event to frontend, then continues loop
- Extensions Store is fully client-side with install/uninstall state (no backend needed)

## Product

- **App Builder**: Mobile Replit-like UI — create projects via AI chat, browse projects, account page
  - **Agent 4 features**: Parallel Agents panel, App Monitoring panel, Design Canvas panel, Branching/Micro VMs panel, Turbo mode (2.5×), Build Together collaboration mode
  - **GitHub browsing**: AI uses `fetch_url` tool to read repos, files, READMEs, file trees — with real-time "Fetching repository..." indicator in chat
  - **Toolbar**: Play (run), Activity (monitoring), Agent (active), Parallel (CPU), Network (branches), Files, Palette (canvas)
  - **Toolbar panels**: Secrets, Database, Auth, Git (all functional slide-up panels)
  - **Git panel**: GitHub token auth, remote URL + repo browser (via GitHub API), Pull/Push with real Git Trees API commit flow, file staging view, commit author editor
  - **Import from GitHub**: animated importing screen → navigates to chat
- **Replit IDE**: Desktop IDE — code editor with syntax highlighting, file tree, AI agent, live preview, extensions store, projects page, profile page
- **Extensions Store**: Browse/install Themes, Linters, Keymaps, AI tools, UI Libraries, State Management, Animation packages

## User Preferences

- Dark GitHub-inspired color palette (`#0d1117`, `#161b22`, `#21262d`)
- Mobile-first design for app-builder

## Gotchas

- Both frontend apps run on different ports (replit-ide: 25212, app-builder: 20311)
- Preview at `/` shows app-builder; use the artifact dropdown to switch to Replit IDE
- API server lib errors during typecheck are expected (libs not pre-built); runtime works fine
- Turbo mode state is local (UI only); Build Together is UI-only collaboration indicator

## Pointers

- See `pnpm-workspace` skill for monorepo structure
- See `react-vite` skill for Vite + React setup conventions
