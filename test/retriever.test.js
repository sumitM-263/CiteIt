import assert from "node:assert/strict";
import test from "node:test";
import { findMentionedSources, retrieve } from "../src/retriever.js";
import { TOP_K_PER_SOURCE } from "../src/config.js";

const doc = { pageContent: "Relevant passage.", metadata: { source: "guide.pdf", page: 2 } };

test("retrieval returns cosine similarity scores and passes a relevant result", async () => {
  const store = {
    async similaritySearchWithScore() {
      return [[doc, 0.2], [{ ...doc, pageContent: "Second passage." }, 0.6]];
    },
  };

  const result = await retrieve(store, "question");

  assert.equal(result.relevant, true);
  assert.equal(result.chunks[0].score, 0.8);
  assert.equal(result.chunks[1].score, 0.4);
});

test("retrieval rejects a result below the configured relevance threshold", async () => {
  const store = {
    async similaritySearchWithScore() {
      return [[doc, 0.9]];
    },
  };

  const result = await retrieve(store, "unanswerable question");

  assert.equal(result.relevant, false);
});

test("retrieval searches each explicitly named PDF and requires evidence from both", async () => {
  const first = {
    ...doc,
    metadata: { source: "paper1.pdf", page: 1 },
  };
  const last = {
    ...doc,
    metadata: { source: "paper5.pdf", page: 2 },
  };
  const calls = [];
  const store = {
    async similaritySearchWithScore(query, k, filter) {
      calls.push({ query, k, filter });
      const result = filter.source === "paper1.pdf" ? first : last;
      return [[result, 0.1]];
    },
  };

  const result = await retrieve(
    store,
    "Compare results in paper1.pdf and paper5.pdf",
    ["paper1.pdf", "paper5.pdf"],
  );

  assert.equal(result.relevant, true);
  assert.deepEqual(
    calls.map(({ filter }) => filter.source).sort(),
    ["paper1.pdf", "paper5.pdf"],
  );
  assert.ok(calls.every(({ k }) => k === TOP_K_PER_SOURCE));
  assert.ok(calls.every(({ query }) => !query.includes(".pdf")));
  assert.deepEqual(
    result.chunks.map(({ doc: retrievedDoc }) => retrievedDoc.metadata.source).sort(),
    ["paper1.pdf", "paper5.pdf"],
  );
});

test("named-document comparison is rejected when one requested paper has no relevant hit", async () => {
  const store = {
    async similaritySearchWithScore(_query, _k, filter) {
      if (filter.source === "paper5.pdf") return [];
      return [[{ ...doc, metadata: { source: "paper1.pdf", page: 1 } }, 0.1]];
    },
  };

  const result = await retrieve(
    store,
    "Compare paper1.pdf with paper5.pdf",
    ["paper1.pdf", "paper5.pdf"],
  );

  assert.equal(result.relevant, false);
});

test("mentioned PDF matching is case-insensitive and supports spaces", () => {
  assert.deepEqual(
    findMentionedSources("Compare PAPER1.PDF and paper five.pdf", [
      "paper1.pdf",
      "paper five.pdf",
      "other.pdf",
    ]),
    ["paper1.pdf", "paper five.pdf"],
  );
});
