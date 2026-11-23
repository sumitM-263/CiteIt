# CiteIt

CiteIt is a Node.js command-line document Q&A prototype. It indexes text-based
PDFs, answers questions using retrieved passages, and prints each cited
passage with its filename and page number.

## What it does

- Loads any number of PDFs from `docs/` and splits their text into overlapping
  chunks (1,000 characters, with 150 characters of overlap).
- Embeds chunks through OpenRouter and stores them in Chroma.
- Retrieves the top four chunks for a normal question. If the question names
  PDF files, it searches each named document separately and retrieves up to
  six chunks from each.
- Skips the LLM when retrieval is below the configured relevance threshold.
  The model is also instructed to answer only from retrieved context and
  refuse when evidence is insufficient.
- Prints citations as chunk references with the full retrieved chunk. These
  are not sentence-level highlights, and citations do not guarantee that each
  generated claim is supported.

This is a prototype: retrieval and model output can be inconsistent,
particularly for broad cross-document questions. Include exact PDF filenames
when asking CiteIt to compare specific documents, and verify important answers
against the printed passages.

## Requirements

- Node.js 20 or newer
- Docker Desktop (to run Chroma locally)
- An OpenRouter API key and access to the configured models

## Setup and run

1. Copy PDFs you are permitted to process into `docs/`. PDF files are ignored
   by Git by default; don't publish documents unless you have permission.
2. Copy `.env.example` to `.env` and add your `OPENROUTER_API_KEY`. Keep `.env`
   private; it is excluded from Git.
3. Start Chroma:

   ```powershell
   docker compose up -d
   ```

4. Add the pdfs/docs in docs folder, then install dependencies and build the index:

   ```powershell
   npm install
   npm run ingest
   ```

5. Start the interactive CLI:

   ```powershell
   npm start
   ```

Type `quit` or `exit` to leave the question loop. After adding or replacing
PDFs, rebuild the index. The collection is named `citeit_documents`; remove
that collection before replacing the corpus so old chunks are not left in the
index.

## Configuration

The `.env.example` file documents the supported settings:

- `OPENROUTER_API_KEY`: required API key.
- `OPENROUTER_BASE_URL`: defaults to `https://openrouter.ai/api/v1`.
- `CHROMA_URL`: defaults to `http://localhost:8000`.
- `EMBEDDING_MODEL`: defaults to `openai/text-embedding-3-small`.
- `LLM_MODEL`: defaults to `openai/gpt-4o-mini`.
- `MIN_RELEVANCE`: defaults to `0.25` on the cosine-similarity scale. A lower
  value admits more results but may also admit weaker matches. The sample
  papers were tested at `0.10`; tune with both answerable and unanswerable
  questions.

## Tests and manual checks

Run the automated tests:

```powershell
npm test
```

For an end-to-end check, run `npm run ingest`, then `npm start` and try questions from the pdf and questions that are not in pdf.

Verify filenames, pages, and passage text for every answer. A refusal on an
answerable question may mean the relevant passage was not retrieved or the
relevance threshold is too high.

## Limitations and troubleshooting

- Supports text-based PDFs only. OCR/scanned PDFs, tables, multilingual
  content, and fine-tuning are out of scope.
- An OpenRouter `422 input rejected by content safety screening` means the
  provider rejected text during embedding; ingestion will not complete.
- An OpenRouter `429` means a provider or free-tier request limit was reached.
  Wait for the limit to reset or check the provider account.
- PDF text is sent to OpenRouter for embedding. At question time, the question
  is embedded and retrieved passages are sent to the chat model. Do not process
  documents you are not permitted to send to that provider.
- Chroma may print a `path` deprecation warning from its client library. It is
  non-fatal if Chroma connects and commands complete.
