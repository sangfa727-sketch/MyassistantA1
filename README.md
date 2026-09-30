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
3. Set OPENAI_API_KEY on the server.
4. Run npm install.
5. Run npm run dev.
6. Open http://localhost:3000.

## Deploy

Deploy to a Next.js-compatible host such as Vercel. Add OPENAI_API_KEY and OPENAI_MODEL as server environment variables. Never expose the API key as NEXT_PUBLIC_*.

## Architecture

Phone/PWA -> Next.js /api/chat -> OpenAI-compatible model provider.

## Security baseline

- API request rate limit: 20 requests/minute per detected client address (in-memory; use a shared store for multi-instance deployment).
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
