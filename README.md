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

For public multi-user production, add authentication, rate limiting, abuse protection, privacy/retention controls, monitoring and a database-backed account system before large-scale release.
