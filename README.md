# DealPilot — AI Sales Intelligence Platform

DealPilot is a local-first B2B sales workspace that turns CRM records into explainable sales intelligence and actionable follow-ups.

It started from a small CRM assignment and was deliberately evolved into a product-style engineering project without requiring a paid API, cloud account, or cloud free tier.

## Product capabilities

- Lead and account workspace
- Deal pipeline with stage transitions
- Activity history and follow-up tasks
- Sales overview dashboard
- Explainable deal-health / attention scoring
- Natural-language-style CRM search for common sales questions
- Grounded account brief using only stored CRM context
- Optional local LLM support through Ollama on `127.0.0.1`
- AI-assisted follow-up draft generated locally from CRM context
- Deterministic fallback so the product works with zero AI services
- Repository/data-access layer around local JSON persistence
- Input validation and API error responses
- Responsive UI

## Zero-cost / no cloud dependency

The default configuration requires only Node.js and npm.

There is:

- no OpenAI API
- no Gemini API
- no paid API
- no cloud database
- no Supabase/Firebase account
- no hosted vector database
- no cloud free tier

The optional AI path uses a model running locally with Ollama. If Ollama is not installed or unavailable, the application automatically uses its deterministic grounded analysis.

## Requirements

- Node.js 20.9+ recommended
- npm
- macOS, Windows or Linux

Next.js's current App Router documentation recommends Node.js 20.9 or later for its dashboard learning path. The project uses the App Router and TypeScript. See the official Next.js documentation if you need environment setup help.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

For a production build:

```bash
npm run build
npm start
```

## Optional local AI

Install Ollama separately if you want the local-model path. Then pull any compatible local model, for example:

```bash
ollama pull qwen2.5:3b
ollama serve
```

Set:

```env
OLLAMA_ENABLED=true
OLLAMA_MODEL=qwen2.5:3b
```

The app calls only the local Ollama endpoint. If it fails, the app falls back automatically.

## Architecture

```text
Browser / Next.js App Router
          |
          v
     Route handlers
          |
          v
   Application functions
      /          \
     v            v
Repository     Intelligence
     |          /   |   \
     v         v    v    v
 local JSON  Risk  Search  Grounded brief
                              |
                     optional local Ollama
```

The important design boundary is the repository layer. The UI/API does not need to know how persistence is implemented. For a real multi-user deployment, the repository can be replaced with a transactional database without rewriting the intelligence layer.

## Explainable deal health

The attention score is intentionally deterministic and inspectable. Signals include:

- activity freshness
- overdue follow-up tasks
- missing rep notes
- stage-specific context

Every flagged deal exposes the reasons behind its score. This avoids presenting an unexplained AI number as fact.

## Natural-language CRM search

The search endpoint supports simple structured intent such as:

- `open deals over $40000`
- `deals needing attention`
- `proposal deals`
- `follow up tasks`
- `Rahul`

This is deliberately implemented with deterministic parsing rather than sending customer data to a third-party LLM.

## Grounded AI design

The account brief receives only the selected CRM record. The prompt explicitly prohibits invented facts and requests a constrained JSON shape. The server validates the result before displaying it.

If no local model is enabled, the deterministic fallback produces the same four sections:

1. Who
2. What matters
3. What happened
4. What's missing

This makes the core product reliable even when no model is available.

## Demo flow

1. Open Overview.
2. Review the pipeline and attention queue.
3. Open a high-risk account.
4. Inspect the explainable risk signals.
5. Move the deal stage.
6. Add an activity.
7. Create or complete a follow-up task.
8. Generate the grounded account brief.
9. Generate a follow-up draft and edit it before use.
10. Try a natural-language CRM search such as `open deals over $40000`.

## Engineering decisions

### Why local JSON?

This project is designed to run with no external services. Local JSON keeps setup deterministic and transparent. The repository abstraction isolates the persistence choice so a transactional database can be introduced later.

### Why no mandatory LLM?

A sales workflow should not stop because an API key is missing. Core CRM behavior and deterministic intelligence remain available offline. A local model is an optional enhancement.

### Why no fake integrations?

The project avoids pretending that an email was actually sent or that a CRM integration exists when it does not. Drafts are generated for review rather than silently performing external actions.

## Scope deliberately excluded

- production authentication
- multi-tenant hosting
- real email sending
- third-party CRM synchronization
- payment processing
- cloud AI APIs

Those are production extensions, not prerequisites for demonstrating the engineering design.
