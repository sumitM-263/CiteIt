import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const DOCS_DIR = path.join(ROOT_DIR, "docs");
export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 150;
export const TOP_K = 4;
export const TOP_K_PER_SOURCE = 6;
export const MIN_RELEVANCE = Number(process.env.MIN_RELEVANCE ?? 0.25);
export const EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL ?? "openai/text-embedding-3-small";
export const LLM_MODEL = process.env.LLM_MODEL ?? "openai/gpt-4o-mini";
export const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
export const CHROMA_URL = process.env.CHROMA_URL ?? "http://localhost:8000";
export const CHROMA_COLLECTION = "citeit_documents";

if (!Number.isFinite(MIN_RELEVANCE) || MIN_RELEVANCE < -1 || MIN_RELEVANCE > 1) {
  throw new Error("MIN_RELEVANCE must be a number between -1 and 1.");
}

export function requireOpenRouterApiKey() {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "OPENROUTER_API_KEY is required. Copy .env.example to .env and add your API key.",
    );
  }
  return OPENROUTER_API_KEY;
}
