import { Ollama } from "ollama";
import {
  createClient,
  RedisClientType as Redis,
  RediSearchSchema,
  SchemaFieldTypes,
  VectorAlgorithms,
} from "redis";
import { documents } from "./data/documents";

interface OllamaConfig {
  host: string;
  model: string;
  embeddingModel: string;
}

interface Document {
  id: string;
  content: string;
  embedding: number[];
}

class RAG {
  private ollama: Ollama;
  private ollamaModel: string;
  private ollamaEmbeddingModel: string;
  private redis: Redis;

  constructor(ollamaConfig: OllamaConfig, redisUrl: string) {
    this.ollama = new Ollama({ host: ollamaConfig.host });
    this.ollamaModel = ollamaConfig.model;
    this.ollamaEmbeddingModel = ollamaConfig.embeddingModel;
    this.redis = createClient({
      url: redisUrl,
    });
  }

  async connect(): Promise<void> {
    await this.redis.connect();

    try {
      await this.createIndex();
      await this.seed();
    } catch (error: any) {
      if (error.message === "Index already exists") {
        console.log("Index exists already, skipped creation.");
      } else {
        console.error(error);
        process.exit(1);
      }
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect();
  }

  async init() {
    await this.connect();
  }

  private async seed() {
    // salário, renda extra, despesas fixas, investimentos, fatura cartão, metas financeiras
    await this.addDocuments(documents);
  }

  private float32ArrayToBuffer(float32Array: number[]): Buffer {
    return Buffer.from(new Float32Array(float32Array).buffer);
  }

  private async createIndex() {
    const schema = {
      content: { type: SchemaFieldTypes.TEXT },
      embedding: {
        type: SchemaFieldTypes.VECTOR,
        ALGORITHM: VectorAlgorithms.HNSW,
        TYPE: "FLOAT32",
        DIM: 768, // 3072 - llama 3.2 / 4096 - llama3.1
        DISTANCE_METRIC: "COSINE",
      },
    } as RediSearchSchema;

    await this.redis.ft.create("idx:finance", schema, {
      ON: "HASH",
      PREFIX: "noderedis:knn",
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.ollama.embeddings({
        model: this.ollamaEmbeddingModel,
        prompt: text,
      });

      return response.embedding;
    } catch (error) {
      console.error("Erro ao gerar embedding:", error);
      throw error;
    }
  }

  async addDocuments(documents: Omit<Document, "embedding">[]): Promise<void> {
    for (const document of documents) {
      await this.addDocument(document);
    }
  }

  async addDocument(document: Omit<Document, "embedding">): Promise<void> {
    const embedding = await this.generateEmbedding(document.content);

    await this.redis.hSet(`noderedis:knn:${document.id}`, {
      embedding: this.float32ArrayToBuffer(embedding),
      content: document.content,
    });
  }

  async search(query: string): Promise<any> {
    const embedding = await this.generateEmbedding(query);

    const results = await this.redis.ft.search(
      "idx:finance",
      "*=>[KNN 5 @embedding $embedding AS score]",
      {
        PARAMS: {
          embedding: this.float32ArrayToBuffer(embedding),
        },
        SORTBY: "score",
        DIALECT: 2,
        RETURN: ["content", "score"],
      },
    );

    return results.documents;
  }

  async generateResponse(query: string): Promise<string> {
    const similarDocuments = await this.search(query);

    const context = similarDocuments.map(
      (document: any) => document.value.content,
    );

    const enrichedPrompt = `
      Contexto:
      ${context.join("\n")}

      Pergunta:
      ${query}

      Baseado no contexto acima, responda a pergunta de forma direta e coerente.
    `;

    const response = await this.ollama.chat({
      model: this.ollamaModel,
      messages: [
        {
          role: "user",
          content: enrichedPrompt,
        },
      ],
    });

    return response.message.content;
  }
}

export { RAG };
