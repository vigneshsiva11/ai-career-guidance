import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type EmbeddingMetadata = {
  provider: "gemini" | "local_fallback";
  model: string;
  dimension: number;
  usedFallback: boolean;
};

export type EmbeddingResult = {
  vector: number[];
  metadata: EmbeddingMetadata;
};

type GenerateEmbeddingOptions = {
  allowLocalFallback?: boolean;
};

export class EmbeddingUnavailableError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "EmbeddingUnavailableError";
    this.status = status;
  }
}

const CANDIDATE_MODELS = [
  process.env.GEMINI_EMBEDDING_MODEL,
  "text-embedding-004",
  "embedding-001",
].filter(Boolean) as string[];

let client: GoogleGenerativeAI | null = null;

function getClient() {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  client = new GoogleGenerativeAI(apiKey);
  return client;
}

async function embedWithModel(input: string, modelName: string): Promise<number[]> {
  const model = getClient().getGenerativeModel({ model: modelName });
  const result = await model.embedContent({
    content: {
      role: "user",
      parts: [{ text: input }],
    },
  });
  return (result.embedding?.values || []) as number[];
}

export async function generateEmbeddingWithMeta(
  text: string,
  options: GenerateEmbeddingOptions = {}
): Promise<EmbeddingResult> {
  const input = String(text || "").trim();
  if (!input) {
    return {
      vector: [],
      metadata: {
        provider: "gemini",
        model: "none",
        dimension: 0,
        usedFallback: false,
      },
    };
  }

  const allowLocalFallback =
    options.allowLocalFallback ?? process.env.ALLOW_LOCAL_EMBEDDING_FALLBACK === "true";

  let lastError: any = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const vector = await embedWithModel(input, modelName);
      if (!vector.length) {
        throw new EmbeddingUnavailableError(
          `Gemini embedding returned empty vector for model ${modelName}`
        );
      }
      console.log(
        `[Embeddings] Using REAL Gemini embeddings (model=${modelName}, dim=${vector.length})`
      );
      return {
        vector,
        metadata: {
          provider: "gemini",
          model: modelName,
          dimension: vector.length,
          usedFallback: false,
        },
      };
    } catch (error: any) {
      lastError = error;
      console.warn(
        `[Embeddings] Gemini embedding model failed (model=${modelName}, status=${error?.status || "unknown"})`
      );
    }
  }

  const statusCode = Number(lastError?.status) || undefined;
  const baseMessage =
    "Embedding model not available. Please configure Gemini embedding access.";

  if (!allowLocalFallback) {
    throw new EmbeddingUnavailableError(baseMessage, statusCode);
  }

  const fallbackVector = generateLocalEmbedding(input);
  console.warn(
    `[Embeddings] WARNING: Falling back to local deterministic embedding (dim=${fallbackVector.length})`
  );
  return {
    vector: fallbackVector,
    metadata: {
      provider: "local_fallback",
      model: "local-deterministic-512",
      dimension: fallbackVector.length,
      usedFallback: true,
    },
  };
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await generateEmbeddingWithMeta(text);
  return result.vector;
}

function generateLocalEmbedding(text: string): number[] {
  const size = 512;
  const out = new Array(size).fill(0);
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  words.forEach((word, idx) => {
    const h = simpleHash(word) % size;
    out[h] += 1 / (idx + 1);
  });
  const norm = Math.sqrt(out.reduce((sum, v) => sum + v * v, 0));
  return norm > 0 ? out.map((v) => v / norm) : out;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
