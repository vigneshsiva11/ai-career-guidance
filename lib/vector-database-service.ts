// Vector Database Service for Educational RAG System
import "server-only";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

export interface DocChunk {
  id: string;
  text: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface SearchResult {
  id: string;
  score: number;
  metadata?: Record<string, any>;
  text?: string;
}

export class VectorDatabaseService {
  private pinecone: Pinecone | null = null;
  private openai: OpenAI | null = null;
  private indexName: string;
  private isInitialized = false;

  constructor() {
    this.indexName = process.env.PINECONE_INDEX_NAME || "educational-content";
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Initialize Pinecone
    if (process.env.PINECONE_API_KEY) {
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      });
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (!this.pinecone) {
      throw new Error(
        "Pinecone not configured. Please set PINECONE_API_KEY environment variable."
      );
    }

    if (!this.openai) {
      throw new Error(
        "OpenAI not configured. Please set OPENAI_API_KEY environment variable."
      );
    }

    try {
      // Check if index exists, create if not
      const indexList = await this.pinecone.listIndexes();
      const indexExists = indexList.indexes?.some(
        (index) => index.name === this.indexName
      );

      if (!indexExists) {
        console.log(`[Vector DB] Creating index: ${this.indexName}`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // OpenAI text-embedding-3-small dimension
          metric: "cosine",
          spec: {
            serverless: {
              cloud: "aws",
              region: "us-east-1",
            },
          },
        });

        // Wait for index to be ready
        await this.waitForIndexReady();
      } else {
        console.log(`[Vector DB] Index ${this.indexName} already exists`);
      }

      this.isInitialized = true;
      console.log("[Vector DB] Initialization complete");
    } catch (error) {
      console.error("[Vector DB] Initialization failed:", error);
      throw error;
    }
  }

  private async waitForIndexReady(): Promise<void> {
    if (!this.pinecone) return;

    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max wait

    while (attempts < maxAttempts) {
      try {
        const indexDescription = await this.pinecone.describeIndex(
          this.indexName
        );
        if (indexDescription.status?.ready) {
          console.log("[Vector DB] Index is ready");
          return;
        }
        console.log(
          `[Vector DB] Waiting for index to be ready... (${
            attempts + 1
          }/${maxAttempts})`
        );
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
        attempts++;
      } catch (error) {
        console.error("[Vector DB] Error checking index status:", error);
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }

    throw new Error(
      "Index creation timeout. Please check your Pinecone configuration."
    );
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Try OpenAI first
    if (this.openai) {
      try {
        const response = await this.openai.embeddings.create({
          model: "text-embedding-3-small",
          input: text,
        });
        return response.data[0].embedding;
      } catch (error: any) {
        console.warn(
          "[Vector DB] OpenAI embedding failed, trying Gemini fallback:",
          error.message
        );
        // Fall through to Gemini fallback
      }
    }

    // Fallback to Gemini embeddings
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "embedding-001" });

      const result = await model.embedContent(text);
      return result.embedding.values as number[];
    } catch (error) {
      console.warn(
        "[Vector DB] Both APIs failed, using local fallback embedding:",
        error
      );
      // Local fallback: simple hash-based embedding
      return this.generateLocalEmbedding(text);
    }
  }

  private generateLocalEmbedding(text: string): number[] {
    // Simple hash-based embedding for testing when APIs are unavailable
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(1536).fill(0);

    words.forEach((word, i) => {
      const hash = this.simpleHash(word);
      const index = hash % 1536;
      embedding[index] += 1 / (i + 1); // Weight by position
    });

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map((val) => (norm > 0 ? val / norm : 0));
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async upsertDocuments(documents: DocChunk[]): Promise<void> {
    if (!this.pinecone || !this.isInitialized) {
      await this.initialize();
    }

    const index = this.pinecone!.index(this.indexName);

    try {
      // Generate embeddings for documents that don't have them
      const documentsWithEmbeddings = await Promise.all(
        documents.map(async (doc) => {
          if (!doc.embedding) {
            doc.embedding = await this.generateEmbedding(doc.text);
          }
          return doc;
        })
      );

      // Prepare vectors for Pinecone
      const vectors = documentsWithEmbeddings.map((doc) => ({
        id: doc.id,
        values: doc.embedding!,
        metadata: {
          text: doc.text,
          ...doc.metadata,
        },
      }));

      // Upsert in batches of 100 (Pinecone limit)
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert(batch);
        console.log(
          `[Vector DB] Upserted batch ${
            Math.floor(i / batchSize) + 1
          }/${Math.ceil(vectors.length / batchSize)}`
        );
      }

      console.log(
        `[Vector DB] Successfully upserted ${documents.length} documents`
      );

    } catch (error) {
      console.error("[Vector DB] Error upserting documents:", error);
      throw error;
    }
  }

  async searchSimilar(
    query: string,
    options: {
      topK?: number;
      grade?: number;
      subject?: string;
      chapter?: string;
      filter?: Record<string, any>;
    } = {}
  ): Promise<SearchResult[]> {
    if (!this.pinecone || !this.isInitialized) {
      await this.initialize();
    }

    const { topK = 5, grade, subject, chapter, filter = {} } = options;

    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query);

      // Build filter
      const pineconeFilter: Record<string, any> = { ...filter };
      if (grade !== undefined) {
        pineconeFilter.grade = grade;
      }
      if (subject) {
        pineconeFilter.subject = subject;
      }
      if (chapter) {
        pineconeFilter.chapter = chapter;
      }

      const index = this.pinecone!.index(this.indexName);
      const searchResponse = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter:
          Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined,
      });

      return (
        searchResponse.matches?.map((match) => ({
          id: match.id,
          score: match.score || 0,
          metadata: match.metadata as Record<string, any>,
          text: match.metadata?.text as string,
        })) || []
      );
    } catch (error) {
      console.error("[Vector DB] Error searching:", error);
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    if (!this.pinecone || !this.isInitialized) {
      await this.initialize();
    }

    try {
      const index = this.pinecone!.index(this.indexName);
      await index.deleteOne(id);
      console.log(`[Vector DB] Deleted document: ${id}`);
    } catch (error) {
      console.error("[Vector DB] Error deleting document:", error);
      throw error;
    }
  }

  async deleteDocuments(ids: string[]): Promise<void> {
    if (!this.pinecone || !this.isInitialized) {
      await this.initialize();
    }

    try {
      const index = this.pinecone!.index(this.indexName);
      await index.deleteMany(ids);
      console.log(`[Vector DB] Deleted ${ids.length} documents`);
    } catch (error) {
      console.error("[Vector DB] Error deleting documents:", error);
      throw error;
    }
  }

  async getIndexStats(): Promise<{
    totalVectors: number;
    dimension: number;
    indexFullness: number;
  }> {
    if (!this.pinecone || !this.isInitialized) {
      await this.initialize();
    }

    try {
      const index = this.pinecone!.index(this.indexName);
      const stats = await index.describeIndexStats();

      return {
        totalVectors:
          (stats as any).totalVectorCount ||
          (stats as any).totalRecordCount ||
          0,
        dimension: (stats as any).dimension || 0,
        indexFullness: (stats as any).indexFullness || 0,
      };
    } catch (error) {
      console.error("[Vector DB] Error getting index stats:", error);
      throw error;
    }
  }

  async clearIndex(): Promise<void> {
    if (!this.pinecone || !this.isInitialized) {
      await this.initialize();
    }

    try {
      const index = this.pinecone!.index(this.indexName);
      await index.deleteAll();
      console.log("[Vector DB] Cleared all vectors from index");
    } catch (error) {
      console.error("[Vector DB] Error clearing index:", error);
      throw error;
    }
  }

  // Batch operations for better performance
  async batchUpsert(
    documents: DocChunk[],
    batchSize: number = 100
  ): Promise<void> {
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      await this.upsertDocuments(batch);
    }
  }

  // Search with multiple queries and combine results
  async searchMultipleQueries(
    queries: string[],
    options: {
      topK?: number;
      grade?: number;
      subject?: string;
      chapter?: string;
      filter?: Record<string, any>;
    } = {}
  ): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];

    for (const query of queries) {
      const results = await this.searchSimilar(query, options);
      allResults.push(...results);
    }

    // Remove duplicates and sort by score
    const uniqueResults = new Map<string, SearchResult>();
    allResults.forEach((result) => {
      if (
        !uniqueResults.has(result.id) ||
        uniqueResults.get(result.id)!.score < result.score
      ) {
        uniqueResults.set(result.id, result);
      }
    });

    return Array.from(uniqueResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, options.topK || 5);
  }
}

// Singleton instance
export const vectorDatabaseService = new VectorDatabaseService();
