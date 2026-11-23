import assert from "node:assert/strict";
import test from "node:test";
import { Document } from "@langchain/core/documents";
import { chunkDocuments } from "../src/chunker.js";

test("chunks preserve only Chroma-compatible source and page metadata", async () => {
  const docs = [
    new Document({
      pageContent: "A paragraph of text to split into a document chunk.",
      metadata: { source: "guide.pdf", page: 2, pdf: { version: "1.7" } },
    }),
  ];

  const chunks = await chunkDocuments(docs);

  assert.ok(chunks.length > 0);
  assert.deepEqual(chunks[0].metadata, { source: "guide.pdf", page: 2 });
});
