import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@agents/lab-1-repo-qa"],
  serverExternalPackages: [
    "langchain",
    "@langchain/langgraph",
    "@langchain/openai",
    "@langchain/core",
  ],
};

export default nextConfig;
