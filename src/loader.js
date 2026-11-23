import { readdir } from "node:fs/promises";
import path from "node:path";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

/**
 * Load every PDF in a folder into page-level LangChain Documents.
 * @param {string} dir Folder containing text-based PDFs.
 * @returns {Promise<import("@langchain/core/documents").Document[]>}
 */
export async function loadPdfs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const pdfPaths = entries
    .filter((entry) => entry.isFile() && /\.pdf$/i.test(entry.name))
    .map((entry) => path.join(dir, entry.name))
    .sort((a, b) => a.localeCompare(b));

  const pages = [];
  for (const pdfPath of pdfPaths) {
    const loadedPages = await new PDFLoader(pdfPath, { splitPages: true }).load();
    loadedPages.forEach((doc, index) => {
      const page =
        doc.metadata.loc?.pageNumber ??
        doc.metadata.pageNumber ??
        doc.metadata.page ??
        index + 1;
      if (!doc.pageContent.trim()) {
        return;
      }
      pages.push({
        pageContent: doc.pageContent,
        metadata: { source: path.basename(pdfPath), page },
      });
    });
  }

  return pages;
}
