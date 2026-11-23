import readline from "node:readline";
import { pathToFileURL } from "node:url";
import { answerQuestion } from "./answerer.js";
import { getStore } from "./vectorStore.js";
import { retrieve } from "./retriever.js";

/**
 * Pretty-print an answer and its citations.
 * @param {{answer: string, citations: Array<{n: number, source: string, page: number, text: string}>}} result
 */
export function printResult(result) {
  console.log(`A: ${result.answer}`);
  if (result.citations.length === 0) {
    return;
  }

  console.log("\nSources:");
  for (const citation of result.citations) {
    console.log(`[${citation.n}] ${citation.source}, p.${citation.page}`);
    console.log(`    "${citation.text}"`);
  }
}

/** Run the interactive retrieval and question-answering loop. */
export async function main() {
  const store = await getStore();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: Boolean(process.stdin.isTTY),
  });

  process.stdout.write("Q: ");
  try {
    for await (const line of rl) {
      const question = line.trim();
      if (/^(exit|quit)$/i.test(question)) {
        break;
      }
      if (!question) {
        process.stdout.write("Q: ");
        continue;
      }

      const result = await retrieve(store, question);
      printResult(
        result.relevant
          ? await answerQuestion(question, result.chunks)
          : { answer: "I don't know.", citations: [] },
      );
      console.log();
      process.stdout.write("Q: ");
    }
  } finally {
    rl.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("CLI failed:", error.message);
    process.exitCode = 1;
  });
}
