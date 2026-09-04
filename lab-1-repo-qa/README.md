# Lab 1 — Repo Q&A

Copy `.env.example` → `.env.local` and set `OPENAI_API_KEY`. Do not commit `.env` files.


**Backend** (`:3001`) — tools, sandbox, `createAgent`

```bash
cd backend
cp .env.example .env.local   # set OPENAI_API_KEY
npm install
npm start                    # POST /chat  GET /health
npm test
```

**Frontend** (`:3000`)

```bash
cd frontend
cp .env.example .env.local   # set OPENAI_API_KEY
npm install
npm run dev
```
