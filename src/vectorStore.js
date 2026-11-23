import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";
import {
  CHROMA_COLLECTION,
  CHROMA_URL,
  EMBEDDING_MODEL,
  OPENROUTER_BASE_URL,
  requireOpenRouterApiKey,
} from "./config.js";

function createEmbeddings() {
  return new OpenAIEmbeddings({
    model: EMBEDDING_MODEL,
    apiKey: requireOpenRouterApiKey(),
    configuration: { baseURL: OPENROUTER_BASE_URL },
  });
}

/**
 * Embed chunks and write them to the Chroma collection.
 * @param {import("@langchain/core/documents").Document[]} chunks
 * @returns {Promise<void>}
 */
export async function buildIndex(chunks) {
  if (chunks.length === 0) {
    throw new Error("No non-empty PDF chunks were produced; nothing to index.");
  }

  await Chroma.fromDocuments(chunks, createEmbeddings(), {
    collectionName: CHROMA_COLLECTION,
    url: CHROMA_URL,
    collectionMetadata: { "hnsw:space": "cosine" },
  });
}

/**
 * Connect to the existing Chroma collection.
 * @returns {Promise<Chroma>}
 */
export async function getStore() {
  return Chroma.fromExistingCollection(createEmbeddings(), {
    collectionName: CHROMA_COLLECTION,
    url: CHROMA_URL,
    collectionMetadata: { "hnsw:space": "cosine" },
  });
}
