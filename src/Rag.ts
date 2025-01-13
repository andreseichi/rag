import { Ollama } from "ollama";
import { Marqo } from "./Marqo";
import {
  createClient,
  RedisClientType as Redis,
  RediSearchSchema,
  SchemaFieldTypes,
  SearchReply,
  VectorAlgorithms,
} from "redis";

interface OllamaConfig {
  host: string;
  model: string;
}

interface Document {
  id: string;
  content: string;
  embedding: number[];
}

class RAG {
  private ollama: Ollama;
  private ollamaModel: string;
  private redis: Redis;
  private indexName = "documentos";

  constructor(ollamaConfig: OllamaConfig, redisUrl: string) {
    this.ollama = new Ollama({ host: ollamaConfig.host });
    this.ollamaModel = ollamaConfig.model;
    this.redis = createClient({
      url: redisUrl,
    });
  }

  async connect(): Promise<void> {
    await this.redis.connect();

    try {
      await this.createIndex();
    } catch (error) {
      console.log("Index might already exist:", error);
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect();
  }

  async init() {
    await this.redis.connect();

    try {
      await this.createIndex();
    } catch (error) {
      console.log("Index might already exist:", error);
    }
  }

  float32ArrayToBuffer(float32Array: number[]): Buffer {
    return Buffer.from(new Float32Array(float32Array).buffer);
  }

  private async createIndex() {
    const schema = {
      // content: { type: SchemaFieldTypes.TEXT },
      v: {
        type: SchemaFieldTypes.VECTOR,
        ALGORITHM: VectorAlgorithms.HNSW,
        TYPE: "FLOAT32",
        DIM: 2,
        DISTANCE_METRIC: "COSINE",
      },
    } as RediSearchSchema;

    try {
      await this.redis.ft.create("idx:receitas", schema, {
        ON: "HASH",
        PREFIX: "noderedis:knn",
      });
    } catch (error: any) {
      if (error.message === "Index already exists") {
        console.log("Index exists already, skipped creation.");
      } else {
        // Something went wrong, perhaps RediSearch isn't installed...
        console.error(error);
        process.exit(1);
      }
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.ollama.embeddings({
        model: this.ollamaModel,
        prompt: text,
      });

      return response.embedding;
    } catch (error) {
      console.error("Erro ao gerar embedding:", error);
      throw error;
    }
  }

  async addDocument(document: Omit<Document, "embedding">): Promise<void> {
    const embedding = await this.generateEmbedding(document.content);

    const response = await this.redis.hSet(
      `noderedis:knn:${document.id}`,
      {
        // embedding: this.float32ArrayToBuffer(embedding),
        v: this.float32ArrayToBuffer([0.1, 0.1]),
      },
    );

    console.log("Response:", response);
  }

  async search(query: string): Promise<SearchReply> {
    const results = await this.redis.ft.search(
      "idx:receitas",
      "*=>[KNN 4 @v $BLOB AS dist]",
      {
        PARAMS: {
          BLOB: this.float32ArrayToBuffer([0.1, 0.1]),
        },
        SORTBY: "dist",
        DIALECT: 2,
        RETURN: ["dist"],
      },
    );

    return results;
  }
}

export { RAG };
