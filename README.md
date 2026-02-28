# LLM-powered Chat Task Tracker

An LLM-powered chat task tracker that turns natural-language messages into structured tasks, supports completing tasks and attaching free-text details, and provides a web UI to view and manage them.

Built with Next.js 16, Hono, AI SDK v6, and Cloudflare D1.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [How the LLM Is Used](#how-the-llm-is-used)
- [Idempotency Approach](#idempotency-approach)
- [Key Tradeoffs & What I'd Improve Next](#key-tradeoffs--what-id-improve-next)
- [Setup & Run](#setup--run)
- [Demo Walkthrough](#demo-walkthrough)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Client (React 19 / Next.js App Router)                 │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │  Chat Page  │  │ Tasks Page │  │  Task Detail Page │  │
│  │  useChat()  │  │ React Query│  │   React Query    │  │
│  └─────┬──────┘  └─────┬──────┘  └────────┬─────────┘  │
│        │               │                   │            │
│  Zustand stores  ◄─────┴───────────────────┘            │
│  Sonner toasts                                          │
└────────┬────────────────────────────────────────────────┘
         │  HTTP (JSON / UIMessage stream)
┌────────▼────────────────────────────────────────────────┐
│  Server (Hono on Next.js catch-all /api/[...route])     │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌─────────────┐  │
│  │ Chat     │ │ Tasks    │ │ Details│ │ Admin/Reset │  │
│  │ Router   │ │ Router   │ │ Router │ │ Router      │  │
│  └────┬─────┘ └────┬─────┘ └───┬────┘ └──────┬──────┘  │
│       │            │           │              │         │
│  ┌────▼────────────▼───────────▼──────────────▼──────┐  │
│  │              Service Layer                        │  │
│  │  ChatService → streamText() + tool calls          │  │
│  │  TasksService / DetailsService                    │  │
│  │  Idempotency (SHA-256 hash + time-bucket)         │  │
│  └───────────────────┬───────────────────────────────┘  │
│                      │  Drizzle ORM                     │
│  ┌───────────────────▼───────────────────────────────┐  │
│  │  Database: Cloudflare D1 (prod & local miniflare)  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         │  HTTPS
┌────────▼────────────────┐
│  OpenRouter API         │
│  stepfun/step-3.5-flash │
│  (free tier)            │
└─────────────────────────┘
```

### Component Boundaries

| Layer | Tech | Responsibility |
|-------|------|----------------|
| **Client** | React 19, `@ai-sdk/react` `useChat`, Zustand, TanStack React Query, Tailwind CSS 4, Sonner | Chat interface, task list/detail views, state management, toast notifications |
| **API** | Hono 4 mounted at `/api/*` via Next.js catch-all route | Routing, CORS, auth middleware, request validation |
| **Chat domain** | AI SDK v6 `streamText`, OpenRouter provider | LLM streaming, tool dispatch, conversation persistence |
| **Task domain** | TasksService / DetailsService | CRUD for tasks and free-text details |
| **Idempotency** | Client-side dedup (10s) + server SHA-256 hash (10s bucket, 60s TTL) | Two-layer duplicate prevention: client blocks rapid re-sends, server catches network retries |
| **Auth** | Optional — activated by setting `SECRET_PASSWORD` | Session-cookie auth, rate-limited login attempts |
| **Database** | Drizzle ORM → Cloudflare D1 (prod & local via miniflare) | tasks, task_details, conversations, messages, sessions, models, idempotency_keys |

### Key Files

```
src/
├── app/                          # Next.js App Router pages
│   ├── chat/page.tsx             # Chat interface
│   ├── tasks/page.tsx            # Task list
│   └── tasks/[id]/page.tsx       # Task detail view (with details)
├── client/
│   ├── components/               # UI components (chat, tasks, auth, shared)
│   └── domain/                   # Client hooks & stores (Zustand, React Query)
├── server/
│   ├── index.ts                  # Hono app — mounts all routers
│   ├── domain/
│   │   ├── chat/                 # chat.router, chat.service, chat.tools, chat.prompts
│   │   ├── tasks/                # tasks.router, tasks.service, tasks.repository
│   │   ├── details/              # details.router, details.service, details.repository
│   │   ├── admin/                # POST /api/admin/reset
│   │   └── auth/                 # Login, session management
│   ├── lib/
│   │   ├── idempotency.ts        # Key generation, check, store
│   │   └── llm.ts                # OpenRouter model factory
│   └── db/                       # Drizzle schema, migration, connection
└── shared/
    ├── types/                    # Zod schemas + z.infer<> types
    └── errors.ts                 # Error codes, server/client error maps
```

---

## How the LLM Is Used

### Prompting Approach

A dynamic **system prompt** is built on every request via `buildSystemPrompt(tasks)`. It injects the current task list as JSON so the LLM can reference task IDs and titles for completion / detail attachment. The prompt contains:

1. **Tool descriptions** — what each tool does and when to use it
2. **Current task list** — full JSON of `{ id, title, status }` for all tasks
3. **Behavioral rules** — always use tools, ask for clarification when ambiguous, reply with hyperlinks
4. **Detailed planning workflow** — when creating tasks, immediately attach actionable detail plans to each one

### Tool / Function Calling Schema

The LLM is given four tools via AI SDK v6's `tool()` with Zod schemas wrapped in `zodSchema()`:

| Tool | Input | Effect |
|------|-------|--------|
| `createTasks` | `{ tasks: [{ title }] }` | Creates one or more tasks |
| `completeTasks` | `{ taskIds: string[] }` | Marks tasks as completed |
| `attachDetail` | `{ taskId, content }` | Attaches a note to one task |
| `attachDetails` | `{ items: [{ taskId, content }] }` | Batch-attaches notes to multiple tasks |

The LLM autonomously decides which tools to call based on user intent. `streamText` runs with `stopWhen: stepCountIs(10)` to cap multi-step tool loops.

### Conversation Persistence

- Full `UIMessage[]` snapshots are persisted per-user (keyed by session token or IP)
- On page load, `GET /api/chat` returns the user's conversation history
- On each response, `toUIMessageStreamResponse({ onFinish })` saves the complete conversation

---

## Idempotency Approach

**Problem:** If the same message is sent twice (network retry, double-click, etc.), it must not create duplicate tasks.

**Solution:** Two-layer deduplication — client-side blocking + server-side content hashing.

### Layer 1 — Client-side (instant)

The `useChatStream` hook tracks the last submitted message text and timestamp. If the same text is submitted within **10 seconds**, it is silently rejected before hitting the network. The submit handler also guards on `isLoading`, preventing sends while a response is still streaming.

### Layer 2 — Server-side (content hash)

1. **Key generation:** `SHA-256(chatId + "::" + messageContent + "::" + floor(now / 10s))` — identical messages within the same conversation and 10-second window produce the same key
2. **Check:** Before processing, the key is looked up in the `idempotency_keys` table
3. **Cache hit:** Returns the cached LLM response verbatim (no tool calls execute)
4. **Cache miss:** Processes normally; stores the response with a **60-second TTL** on `onFinish`
5. **Expiry:** Keys older than 60 seconds are cleaned up on lookup, so the same message can be re-processed shortly after

### Why this works

- **Client layer** catches the most common case (double-click, rapid Enter) with zero latency
- **Server layer** catches network-level retries and race conditions that bypass the client
- The **10-second bucket** is short enough that users can intentionally re-send a message after a brief pause
- The **60-second TTL** prevents unbounded key growth without blocking legitimate repeated messages
- Chat ID scoping means the same text in different conversations is treated independently
- SHA-256 ensures collision resistance without storing raw message content
- Keys are stored with `onConflictDoNothing` so concurrent requests are safe

### Verification

```bash
# pnpm reset clears everything, then try:
pnpm reset

# Send the same message twice in the chat UI within 10 seconds.
# The second message is blocked client-side — no network request is made
# and no duplicate tasks appear in the task list.

# Or programmatically (bypasses client guard, tests server layer):
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"Create a task called Buy milk"}]}]}'

# Send again within 10 seconds — same response, no duplicate task
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"Create a task called Buy milk"}]}]}'
```

---

## Key Tradeoffs & What I'd Improve Next

### Tradeoffs Made

| Decision | Rationale |
|----------|-----------|
| **Free LLM tier** (stepfun/step-3.5-flash via OpenRouter) | Zero cost, reliable tool-calling support; trade-off is occasional slower responses |
| **Full task list in system prompt** | Simple & correct for a small task set (dozens); works because the spec assumes S3 |
| **10-second idempotency bucket + 60s TTL** | Short window catches retries without blocking intentional repeats; client-side layer adds zero-latency first line of defense |
| **D1 everywhere (prod & local via miniflare)** | Single database driver, no native Node module bundling issues; `initOpenNextCloudflareForDev()` provides local D1 bindings |
| **Session or IP-based chat isolation** | Per-user conversations without requiring accounts; IP fallback for unauthenticated mode |
| **No websocket — SSE streaming** | AI SDK v6's `toUIMessageStreamResponse` uses SSE; simpler than WebSocket for this use case |

### What I'd Improve Next

1. **Test coverage** — Add vitest unit tests for services and integration tests for the tool-calling flow
2. **Prompt token management** — Truncate or summarize older messages when conversation grows beyond a threshold to prevent context overflow
3. **Task pagination** — If the task set grows beyond "small," paginate the task list and use embeddings to find relevant tasks instead of injecting all into the prompt
4. **Offline/optimistic UI** — Optimistic task completion in the web UI before server confirmation
5. **Multi-user auth** — Replace the single shared password with proper user accounts
6. **Observability** — Structured logging, LLM cost tracking, latency metrics

---

## Setup & Run

### Prerequisites

- Node.js 20+
- pnpm

### 1. Clone & Install

```bash
git clone git@github.com:jjspscl/llm-todo.git
cd llm-todo
pnpm install
```

### 2. Configure Environment

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
SECRET_PASSWORD=              # leave blank for no auth, or set a password
```

Get a free API key at [openrouter.ai](https://openrouter.ai/).

### 3. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The app uses a local Cloudflare D1 database (via miniflare). Apply migrations on first run:

```bash
npx wrangler d1 migrations apply llm-todo --local
```

### 4. Reset System State

```bash
pnpm reset
```

Or send `POST /api/admin/reset` — clears all tasks, details, conversations, sessions, and idempotency keys.

---

## Demo Walkthrough

Start the app with `pnpm dev` and open [http://localhost:3000](http://localhost:3000).

### Demo 1 — Create Multiple Tasks from One Message

1. Navigate to the **Chat** page
2. Type: **"I need to buy groceries, schedule a dentist appointment, and renew my car insurance"**
3. The LLM creates 3 tasks and replies with clickable links to each one
4. Switch to the **Tasks** page — all 3 tasks appear with attached detail plans

### Demo 2 — Complete a Task from Natural Language

1. In the Chat, type: **"I finished the groceries"**
2. The LLM matches "groceries" to the correct task and marks it completed
3. The Tasks page shows the task with a ✓ completed status

### Demo 3 — Attach a Detail to a Task

1. In the Chat, type: **"For the dentist appointment, it's Dr. Smith at 2pm on Friday, bring insurance card"**
2. The LLM attaches this detail to the dentist task
3. Click the task link (or navigate to Tasks → click the task) to see the detail in the detail view

### Demo 4 — Idempotency Verification

1. Run `pnpm reset` to start clean
2. Type: **"Create a task called Write unit tests"**
3. Task is created (check the Tasks page — 1 task)
4. Immediately type the exact same message: **"Create a task called Write unit tests"**
5. The message is blocked client-side (within 10s) — the Tasks page still shows only 1 task
6. Wait 15 seconds and send it again — the server-side idempotency key has also expired, so the LLM processes it fresh

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start local dev server (Turbopack) |
| `pnpm build` | Build for Cloudflare Workers (via OpenNext) |
| `pnpm reset` | Reset all data to clean slate |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run all vitest tests |
| `pnpm test:idem` | Run idempotency tests only |

## License

MIT
