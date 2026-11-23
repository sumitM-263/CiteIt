import assert from "node:assert/strict";
import test from "node:test";
import { buildPrompt, extractCitations } from "../src/answerer.js";

const chunks = [
  {
    doc: {
      pageContent: "Employees may carry over up to 5 unused leave days.",
      metadata: { source: "hr-policy.pdf", page: 4 },
    },
  },
  {
    doc: {
      pageContent: "The policy takes effect on January 1.",
      metadata: { source: "hr-policy.pdf", page: 1 },
    },
  },
];

test("grounded prompt requires citations and exact refusal", () => {
  const prompt = buildPrompt("What is the carry-over limit?", chunks);

  assert.match(prompt, /Answer the question using only the context/);
  assert.match(prompt, /reply exactly: I don't know\./);
  assert.match(
    prompt,
    /\[1\] Source: hr-policy\.pdf, page 4\nEmployees may carry over up to 5 unused leave days\./,
  );
});

test("citations include each valid cited passage once and ignore invalid numbers", () => {
  const citations = extractCitations("Up to 5 days [1], under the policy [1][2][9].", chunks);

  assert.deepEqual(citations, [
    {
      n: 1,
      source: "hr-policy.pdf",
      page: 4,
      text: "Employees may carry over up to 5 unused leave days.",
    },
    {
      n: 2,
      source: "hr-policy.pdf",
      page: 1,
      text: "The policy takes effect on January 1.",
    },
  ]);
});
