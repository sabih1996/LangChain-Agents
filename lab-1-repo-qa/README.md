# Lab 1 — Repo Q&A

An LLM agent that answers questions about a local TypeScript sample (`backend/demo-repo`) using LangChain `createAgent`.

- You ask in the chat UI (or `POST /chat`); the model does not see the whole disk.
- It calls **read-only** tools: `list_dir`, `read_file`, `grep`.
- Paths must stay inside the demo repo (sandbox).
- It cites file paths in the answer; it cannot write, delete, or run shell commands.
- Conversation state is kept in-memory per `threadId` while the process is running.

Copy `.env.example` → `.env.local` and set `OPENAI_API_KEY`. Do not commit `.env` files.

**Backend** (`:3001`)

```bash
cd backend
cp .env.example .env.local
npm install
npm start    # POST /chat  GET /health
npm test
```

**Frontend** (`:3000`)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
