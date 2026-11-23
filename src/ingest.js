import { DOCS_DIR } from "./config.js";
import { chunkDocuments } from "./chunker.js";
import { loadPdfs } from "./loader.js";
import { buildIndex } from "./vectorStore.js";
import { pathToFileURL } from "node:url";

/** Load, chunk, embed, and store the configured PDF collection. */
export async function main() {
  const pages = await loadPdfs(DOCS_DIR);
  const chunks = await chunkDocuments(pages);
  await buildIndex(chunks);
  console.log(`Loaded ${pages.length} non-empty PDF pages.`);
  console.log(`Indexed ${chunks.length} chunks in Chroma.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("Ingest failed:", error.message);
    process.exitCode = 1;
  });
}
