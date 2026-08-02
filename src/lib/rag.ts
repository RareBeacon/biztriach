import { PdfReader } from "pdfreader";
import mammoth from "mammoth";

// Biztriach RAG Engine v2 - Production Ready

const VECTOR_DIM = 384;
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

export async function extractTextFromFile(buffer: Buffer, fileType: string): Promise<string> {
  const type = fileType.toLowerCase();

  if (type === "txt" || type === "md" || type === "markdown") {
    return buffer.toString("utf-8");
  }

  if (type === "pdf") {
    try {
      // @ts-ignore - pdf-parse dynamic
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = (pdfParseModule as any).default || pdfParseModule;
      const data = await pdfParse(buffer);
      if (data.text && data.text.trim().length > 50) {
        return data.text;
      }
    } catch (e) {
      console.warn("[RAG] pdf-parse fallback", (e as Error).message);
    }

    try {
      return await new Promise<string>((resolve, reject) => {
        let text = "";
        let page = 1;
        new PdfReader({}).parseBuffer(buffer, (err: any, item: any) => {
          if (err) {
            reject(new Error(`PDF extraction failed: ${err.message}`));
          } else if (!item) {
            if (text.trim().length === 0) {
              reject(new Error("PDF contains no extractable text"));
            } else {
              resolve(text);
            }
          } else if (item.text) {
            text += item.text + " ";
          } else if (item.page) {
            text += `\n\n[Page ${page}]\n`;
            page++;
          }
        });
      });
    } catch (error) {
      console.error("PDF extraction failed:", error);
      throw new Error("Failed to extract text from PDF. Try DOCX or TXT.");
    }
  }

  if (type === "docx") {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (!result.value || result.value.trim().length < 10) {
        throw new Error("DOCX appears empty");
      }
      return result.value;
    } catch (error) {
      console.error("DOCX parsing error:", error);
      throw new Error("Failed to extract DOCX content");
    }
  }

  throw new Error(`Unsupported file type: ${fileType}. Allowed: pdf, docx, txt, md`);
}

interface Chunk {
  content: string;
  pageNumber: number;
}

export function splitTextIntoChunks(text: string, options: { chunkSize?: number; chunkOverlap?: number } = {}): Chunk[] {
  const chunkSize = options.chunkSize || CHUNK_SIZE;
  const chunkOverlap = options.chunkOverlap || CHUNK_OVERLAP;

  const cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\u0000/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (cleaned.length === 0) return [];

  const pageRegex = /\[Page (\d+)\]|\f/g;
  const pageBreaks: { index: number; page: number }[] = [];
  let match;
  let currentPage = 1;
  while ((match = pageRegex.exec(cleaned)) !== null) {
    if (match[1]) currentPage = parseInt(match[1], 10);
    else currentPage++;
    pageBreaks.push({ index: match.index, page: currentPage });
  }

  const getPage = (charIndex: number): number => {
    let page = 1;
    for (const pb of pageBreaks) {
      if (pb.index <= charIndex) page = pb.page;
      else break;
    }
    return page;
  };

  const chunks: Chunk[] = [];
  let start = 0;
  let iterations = 0;

  while (start < cleaned.length) {
    iterations++;
    if (iterations > 15000) throw new Error("Chunker exceeded 15k iterations");

    let end = Math.min(start + chunkSize, cleaned.length);

    if (end < cleaned.length) {
      const lookahead = cleaned.substring(start, Math.min(end + 200, cleaned.length));
      const paragraphBreak = lookahead.lastIndexOf("\n\n", chunkSize);
      const newlineBreak = lookahead.lastIndexOf("\n", chunkSize);
      const spaceBreak = lookahead.lastIndexOf(" ", chunkSize);

      if (paragraphBreak > chunkSize * 0.5) end = start + paragraphBreak + 2;
      else if (newlineBreak > chunkSize * 0.6) end = start + newlineBreak + 1;
      else if (spaceBreak > chunkSize * 0.5) end = start + spaceBreak;
    }

    const content = cleaned.substring(start, end).trim();
    if (content.length > 30) {
      chunks.push({ content, pageNumber: getPage(start) });
    }

    if (end >= cleaned.length) break;
    start = Math.max(start + 1, end - chunkOverlap);
  }

  return chunks;
}

export async function generateEmbedding(text: string, retry = 2): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const trimmed = text.slice(0, 8000);

  if (apiKey && apiKey.trim() !== "") {
    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://biztriach.vercel.app",
          },
          body: JSON.stringify({
            model: "cohere/embed-english-v3.0",
            input: [trimmed],
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          if (data.data?.[0]?.embedding) return data.data[0].embedding;
        } else if (response.status === 429 && attempt < retry) {
          await sleep(1000 * (attempt + 1));
          continue;
        }
      } catch (e) {
        if (attempt < retry) await sleep(500 * (attempt + 1));
      }
    }
  }

  return generateLocalEmbedding(trimmed);
}

export async function generateEmbeddingsBatch(texts: string[], concurrent = 5): Promise<number[][]> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (apiKey && apiKey.trim() !== "" && texts.length > 0) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://biztriach.vercel.app",
        },
        body: JSON.stringify({
          model: "cohere/embed-english-v3.0",
          input: texts.map(t => t.slice(0, 8000)),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data) && data.data.length === texts.length) {
          return data.data.map((item: any) => item.embedding);
        }
      }
    } catch (e) {
      console.warn("[RAG] Batch API failed, concurrent fallback");
    }

    const results: number[][] = [];
    for (let i = 0; i < texts.length; i += concurrent) {
      const batch = texts.slice(i, i + concurrent);
      const batchEmbeds = await Promise.all(batch.map(t => generateEmbedding(t, 1)));
      results.push(...batchEmbeds);
    }
    return results;
  }

  return texts.map(t => generateLocalEmbedding(t));
}

function generateLocalEmbedding(text: string): number[] {
  const vector = new Array(VECTOR_DIM).fill(0);
  const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = cleaned.split(/\s+/).filter(w => w.length > 2);
  const bigrams = [];
  for (let i = 0; i < words.length - 1; i++) bigrams.push(words[i] + "_" + words[i + 1]);

  if (words.length === 0) {
    vector[0] = 1;
    return vector;
  }

  const hash = (str: string): number => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  };

  for (const w of words) {
    const idx = hash(w) % VECTOR_DIM;
    const idx2 = hash(w + "_salt") % VECTOR_DIM;
    vector[idx] += 1.0;
    vector[idx2] += 0.6;
  }
  for (const bg of bigrams) {
    const idx = hash(bg) % VECTOR_DIM;
    vector[idx] += 0.7;
  }

  const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIM; i++) vector[i] /= norm;
  }
  return vector;
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function keywordScore(query: string, content: string): number {
  const qWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const cLower = content.toLowerCase();
  if (qWords.length === 0) return 0;
  let matches = 0;
  for (const qw of qWords) if (cLower.includes(qw)) matches++;
  return matches / qWords.length;
}

export interface DocumentSource {
  documentTitle: string;
  documentId: string;
  pageNumber: number;
  content: string;
  score: number;
  keywordScore: number;
  hybridScore: number;
}

export function retrieveRelevantChunks(
  queryVector: number[],
  queryText: string,
  dbChunks: { content: string; pageNumber: number; embedding: string; document: { title: string; id: string } }[],
  topK = 4
): DocumentSource[] {
  const scored = dbChunks.map(chunk => {
    let vec: number[];
    try {
      vec = JSON.parse(chunk.embedding);
      if (!Array.isArray(vec)) vec = new Array(VECTOR_DIM).fill(0);
    } catch {
      vec = new Array(VECTOR_DIM).fill(0);
    }

    const semantic = cosineSimilarity(queryVector, vec);
    const kw = keywordScore(queryText, chunk.content);
    const hybrid = semantic * 0.75 + kw * 0.25 + (kw > 0.6 ? 0.1 : 0);

    return {
      documentTitle: chunk.document.title,
      documentId: chunk.document.id,
      pageNumber: chunk.pageNumber,
      content: chunk.content,
      score: semantic,
      keywordScore: kw,
      hybridScore: hybrid,
    };
  });

  return scored
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .filter(c => c.hybridScore > 0.08)
    .slice(0, topK);
}
