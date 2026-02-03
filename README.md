# Phazur

**Stop Chatting with AI. Start Commanding It.**

AI-native learning platform that teaches practical AI skills through hands-on project building.

**Live Site:** [https://pla-ten-eosin.vercel.app](https://pla-ten-eosin.vercel.app)

## Overview

Phazur is a terminal-first educational platform where learners build real AI workflows, earn elite credentials, and mint proof of mastery on-chain. No quizzes, no PDFs — just deployed projects and blockchain-verified certificates.

### Key Features

- **Terminal-First Learning** - Learn from the command line like real developers
- **Socratic AI Coach** - Guides thinking through questions, not answers
- **On-Chain Credentials** - Soulbound Tokens (SBTs) on Polygon blockchain
- **Pay After You Ship** - Zero upfront cost, pay only after completing your capstone

## Learning Paths

| Path | Title | Price | Credential |
|------|-------|-------|------------|
| **A** | The Student | $49 | Certified AI Associate |
| **B** | The Employee | $199 | Workflow Efficiency Lead |
| **C** | The Owner | $499 | AI Operations Master |

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Auth/Database | Supabase |
| Blockchain | Thirdweb SDK (Polygon) |
| AI | OpenAI API |
| Terminal | xterm.js |
| Real-time | Socket.io |
| Vector DB | Pinecone |

## Project Structure

```
maestro-platform/
├── src/
│   └── app/
│       ├── layout.tsx      # Root layout
│       └── page.tsx        # Landing page
├── public/                 # Static assets
├── contracts/              # Smart contracts (SBTs)
├── curriculum/             # Course content
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase account
- Thirdweb account (for blockchain)

### Installation

```bash
# Clone the repository
git clone https://github.com/Hempp/maestro-platform.git
cd maestro-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Environment Variables

Required in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Thirdweb (Blockchain)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=

# OpenAI
OPENAI_API_KEY=

# Pinecone
PINECONE_API_KEY=
PINECONE_INDEX=
```

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Deployment

Deployed on Vercel with automatic deployments from the `main` branch.

```bash
# Deploy to Vercel
vercel --prod
```

## Platform Features

### Three-View Interface
- **Chat** - Conversational AI guidance
- **Terminal** - Command-line building environment
- **Sandbox** - Live code preview

### Credential System
- Soulbound Tokens (non-transferable NFTs)
- Minted on Polygon blockchain
- Publicly verifiable on-chain
- Permanent proof of completion

### Learning Philosophy
- Build first, learn through doing
- Socratic method coaching
- Code verification, not quizzes
- Real deployed projects as proof

## License

Private - All rights reserved.

---

*"Build first, pay later."*
