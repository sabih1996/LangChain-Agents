import { Chat } from "../components/Chat";

export default function HomePage() {
  return (
    <main>
      <h1>Lab 1 — Repo Q&A</h1>
      <p className="lede">
        A LangChain <code>createAgent</code> loop with three read-only tools over{" "}
        <code>backend/demo-repo/</code>. The diagrams below are the flow images
        in this lab folder.
      </p>
      <section className="diagrams">
        <p className="caption">1. Request path — browser to agent and back</p>
        <img src="/01-request-path.png" alt="Request path flowchart" />
        <p className="caption">2. Agent loop — model and tools take turns</p>
        <img src="/02-agent-loop.png" alt="Agent loop flowchart" />
        <p className="caption">3. Tool safety — paths must stay in demo-repo</p>
        <img src="/03-tool-safety.png" alt="Tool safety flowchart" />
      </section>
      <Chat />
    </main>
  );
}
