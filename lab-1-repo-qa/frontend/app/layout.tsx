import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Lab 1 — Repo Q&A",
  description: "Learn LangChain createAgent by chatting over a local demo repo.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
