# Replit IDE Workspace Clone

A mobile-first Replit clone with two apps: **App Builder** (mobile UI matching the Replit app) and **Replit IDE** (full workspace with editor, projects, and extensions store).

## Run & Operate

- `pnpm install` — install all dependencies
- `pnpm run typecheck` — typecheck all packages
- `pnpm run build` — build all packages
- API Server: `PORT=8000 pnpm --filter @workspace/api-server run dev`
- App Builder: `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/app-builder run dev` (webview port)
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
  - **New Pages (v2)**: Notifications (`/notifications`), Public Profile (`/profile/:username`), Plans & Pricing (`/plans`), Bounties (`/bounties`)
  - **New Components**: `NotificationBell` (bell icon with unread badge in header), `GlobalSearch` (full-screen search overlay), `ReplDetailSheet` (slide-up detail view for repls in Explore), `TrendingSection` (home page horizontal scroll), `AchievementsBar`
  - **Header**: Search icon + notification bell with live unread count badge + user avatar
  - **Agent 4 features**: Parallel Agents, App Monitoring, Design Canvas, Branching/Micro VMs, Turbo mode (2.5×), Build Together, Multi-Artifact (Web/Mobile/Slides/API/Desktop), Agent Memory (confidence-scored facts), Checkpoint Timeline (restore to any point), Agent Insights (tokens/cost/speed stats)
  - **Quick Suggestions**: Swipeable prompt chips appear after each AI reply (dismissed on tap or ×)
  - **More menu**: ··· button opens overlay with Memory / Checkpoints / Insights / Files / Deploy / Webview
  - **GitHub browsing**: AI uses `fetch_url` tool to read repos, files, READMEs, file trees — with real-time "Fetching repository..." indicator in chat
  - **Toolbar**: Play (run), Activity (monitoring), Agent (active), Parallel (CPU), Network (branches), Layers (multi-artifact), Palette (canvas)
  - **Toolbar panels**: Secrets, Database, Auth, Git (all functional slide-up panels)
  - **Git panel**: GitHub token auth, remote URL + repo browser (via GitHub API), Pull/Push with real Git Trees API commit flow, file staging view, commit author editor, **branch switcher** (create/switch/delete branches)
  - **AI Models Panel** (`artifacts/app-builder/src/components/AIModelsPanel.tsx`): Full-screen panel opened via Core+ button with **60+ models** across 17 providers (Anthropic, OpenAI, Google, Meta, NVIDIA, DeepSeek, Qwen, xAI, Mistral, MiniMax, NousResearch, Poolside, Tencent/Baidu/InclusionAI, Z-AI, OpenRouter, Cohere). All OpenRouter model IDs. FREE filter shows all free-tier models.
  - **Ensemble Tab** (2nd tab): Real multi-AI collaboration. Select 2–6 free models → Diverge (parallel calls) → Synthesise. **Debate Mode toggle**: models read each other's answers and argue/refine before synthesis — 4-phase pipeline (Diverge → Debate → Synthesise). Backend: `POST /api/openrouter/ensemble` + `POST /api/openrouter/debate`.
  - **Arena Tab** (3rd tab): Chatbot Arena–style side-by-side battle. Pick Model A vs Model B, same prompt, parallel real calls, then vote 👈A / 🤝Tie / B👉. Builds live session leaderboard with win counts and bar chart. OpenRouter API key shared across all tabs. Backend: `POST /api/openrouter/arena`.
  - GODMODE CLASSIC, ULTRAPLINIAN (5 tiers 10–55 models), Parseltongue (6 techniques, live preview), AutoTune (EMA), STM Modules, Konami Easter egg
  - **Import from GitHub**: animated importing screen → navigates to chat
  - **OMEGA — 45 Tools, 138 Agent Types** (`artifacts/api-server/src/routes/super-agent.ts`):
    - **Advanced AI/Planning (15 new from zip archives)**:
      - `goap_planner` — GOAP A* search (Ruflo agent-goal-planner): optimal action sequences, replanning
      - `code_review_swarm` — Multi-agent parallel code review: security/perf/style/logic/tests (Ruflo)
      - `autotune` — G0DM0D3 AutoTune: context-adaptive LLM parameters with EMA feedback loop
      - `neural_train` — Neural network training: feedforward/LSTM/GAN/Transformer (Ruflo flow-nexus-neural)
      - `multi_agent_dispatch` — Oracle/Librarian/Explorer/Frontend/Backend/DevOps parallel agents (oh-my-openagent)
      - `ast_search` — AST-Grep structural code search across 25 languages with metavariables
      - `github_pr_manager` — GitHub PR create/review/merge/label/sync-board (Ruflo agent-github-pr-manager)
      - `benchmark_suite` — Latency/throughput/memory/CPU benchmarking with regression detection
      - `production_validate` — Health checks, smoke tests, SLA validation post-deployment
      - `release_manager` — Changelog, semver, git tag, npm/pypi publish, announcements (Ruflo release-swarm)
      - `memory_sync` — Cross-session memory: sync, semantic search, compress, namespaces (claude-mem)
      - `hive_mind` — Collective intelligence: 10-500 micro-agents + convergence synthesis (Ruflo hive-mind)
      - `security_audit` — SAST/DAST/deps/secrets/OWASP/threat modeling (Ruflo security-audit + nanobot)
      - `data_pipeline` — ETL, feature engineering, ML training, evaluation, deployment pipeline
      - `workflow_automation` — n8n-style workflows, cron, webhooks, conditional branching (Ruflo)
    - **Ruflo Swarm expanded from 12 → 138+ agent persona types** covering: coordination (byzantine, raft, gossip, mesh, queen, quorum, sparc), code (tdd-london, sparc-implementer, code-review-swarm), architecture (DDD, repo-architect), GitHub (pr-manager, multi-repo, release-swarm), AI/ML (neural-network, flow-nexus, SAFLA, SONA, trading-predictor), security (v3-security-architect), memory (agentdb, reasoningbank, embeddings), performance (matrix-optimizer, pagerank, load-balancer), V3 specialists, and more
    - **Frontend TOOL_LABELS** updated for all 15 new tools with rich contextual labels
    - **ROLE_EMOJI + ROLE_COLOR** maps expanded to cover all 138 Ruflo agent types with unique icons and colors
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
