import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CHUNK_OVERLAP, CHUNK_SIZE } from "./config.js";

/**
 * Split page-level Documents into overlapping chunks.
 * @param {import("@langchain/core/documents").Document[]} docs
 * @returns {Promise<import("@langchain/core/documents").Document[]>}
 */
export async function chunkDocuments(docs) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });
  const chunks = await splitter.splitDocuments(docs);
  return chunks.map((doc) => ({
    ...doc,
    metadata: {
      source: doc.metadata.source,
      page: doc.metadata.page,
    },
  }));
}
