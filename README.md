# My Assistant A1

Mobile-first AI assistant web app for phones, tablets and desktop browsers.

## Included

- Burmese-first conversational AI UI
- Responsive mobile layout
- PWA install support
- Local conversation history
- Voice input when Web Speech API is supported
- Text-to-speech for replies
- Server-side API key handling
- OpenAI-compatible provider configuration
- Basic safety and reliability instructions

## Run

1. Use Node.js 20+.
2. Copy .env.example to .env.local.
3. Set OPENAI_API_KEY and A1_SESSION_SECRET on the server. Generate A1_SESSION_SECRET with `openssl rand -base64 32`; never commit it or expose it as a `NEXT_PUBLIC_*` variable.
4. Run npm ci.
5. Run npm run dev.
6. Open http://localhost:3000.

## Deploy

Deploy the full app to a Next.js-compatible host such as Vercel. Add OPENAI_API_KEY, OPENAI_MODEL and DATABASE_URL as server environment variables. Never expose secrets as NEXT_PUBLIC_*.

GitHub Pages can host the static UI, but it cannot execute the server-side `/api/chat`, `/api/tasks/plan` or `/api/health` routes. When the UI is hosted on Pages and the API is hosted separately, set `NEXT_PUBLIC_API_BASE_URL` at build time to the HTTPS origin of that backend.

## Architecture

Phone/PWA -> Next.js /api/chat -> OpenAI-compatible model provider.

## Security baseline

- API request rate limit: 20 requests/minute per detected client address (in-memory; use a shared store for multi-instance deployment).
- Chat sessions require a per-session signed, HttpOnly, Secure-in-production, SameSite=Strict cookie proof. The signing key is `A1_SESSION_SECRET` (32 bytes minimum).
- This cookie proof protects against session-ID-only access; it is not account authentication, user identity, or multi-tenant authorization. Do not use it as a substitute for the pending Managed Better Auth integration and RLS policies.
- Request body size guard on the chat endpoint.
- Security response headers via middleware.
- API responses are marked no-store where appropriate.
- API keys remain server-side.

## Production roadmap

Before opening the service to a large public audience, add:
1. Authentication and per-user authorization.
2. Persistent database-backed conversations and optional memory.
3. Shared rate limiting (Redis/Upstash or a database-backed limiter) for multiple server instances.
4. Abuse controls, quotas and spend limits.
5. Privacy/retention settings and account deletion.
6. Observability, alerts and provider-failure handling.
7. Automated dependency/security scanning.

The current rate limiter is intentionally lightweight and is not a replacement for a shared production limiter.


## Deployment status

The GitHub Pages workflow is manual-only until a Pages site is enabled and configured. GitHub Pages can host the static UI only; it does not run the Next.js API routes. Production chat and task-planning features require a separately deployed Next.js-compatible backend with the required server-side environment variables.
