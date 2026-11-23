import { readdir } from "node:fs/promises";
import {
  DOCS_DIR,
  MIN_RELEVANCE,
  TOP_K,
  TOP_K_PER_SOURCE,
} from "./config.js";

export function findMentionedSources(question, availableSources) {
  const normalizedQuestion = question.toLocaleLowerCase();
  return availableSources.filter((source) =>
    normalizedQuestion.includes(source.toLocaleLowerCase()),
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Retrieve the most relevant chunks and decide if any are relevant enough.
 * @param {import("@langchain/community/vectorstores/chroma").Chroma} store
 * @param {string} question
 * @param {string[]} [availableSources] PDF filenames; defaults to PDFs in DOCS_DIR.
 * @returns {Promise<{chunks: Array<{doc: import("@langchain/core/documents").Document, score: number}>, relevant: boolean}>}
 */
export async function retrieve(store, question, availableSources) {
  let sources = availableSources ?? [];
  if (availableSources === undefined && /\.pdf\b/i.test(question)) {
    const entries = await readdir(DOCS_DIR, { withFileTypes: true });
    sources = entries
      .filter((entry) => entry.isFile() && /\.pdf$/i.test(entry.name))
      .map((entry) => entry.name);
  }
  const requestedSources = findMentionedSources(question, sources);

  if (requestedSources.length > 0) {
    let searchQuery = question;
    for (const source of requestedSources) {
      searchQuery = searchQuery.replace(
        new RegExp(escapeRegExp(source), "gi"),
        " ",
      );
    }
    searchQuery = searchQuery.replace(/\s+/g, " ").trim() || question;
    const resultsBySource = await Promise.all(
      requestedSources.map((source) =>
        store.similaritySearchWithScore(searchQuery, TOP_K_PER_SOURCE, {
          source,
        }),
      ),
    );
    const chunks = resultsBySource
      .flat()
      .map(([doc, distance]) => ({ doc, score: 1 - distance }))
      .sort((a, b) => b.score - a.score);

    const relevantSources = new Set(
      chunks
        .filter(({ score }) => score >= MIN_RELEVANCE)
        .map(({ doc }) => doc.metadata.source),
    );
    return {
      chunks,
      relevant: requestedSources.every((source) => relevantSources.has(source)),
    };
  }

  const results = await store.similaritySearchWithScore(question, TOP_K);
  const chunks = results
    .map(([doc, distance]) => ({ doc, score: 1 - distance }))
    .sort((a, b) => b.score - a.score);

  return {
    chunks,
    relevant: chunks.length > 0 && chunks[0].score >= MIN_RELEVANCE,
  };
}
