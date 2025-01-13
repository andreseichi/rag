interface MarqoConfig {
  host: string;
  index: string;
}

interface MarqoDocument {
  title: string;
  description: string;
}

class Marqo {
  private marqoHost: string;
  private marqoIndex: string;

  constructor(marqoConfig: MarqoConfig) {
    this.marqoHost = marqoConfig.host;
    this.marqoIndex = marqoConfig.index;
  }

  async createIndex(index: string): Promise<void> {
    try {
      await fetch(`${this.marqoHost}/indexes/${index}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "hf/e5-base-v2",
        }),
      });
    } catch (error) {
      console.error("Erro ao criar índice:", error);
      throw error;
    }
  }

  async listIndexes(): Promise<void> {
    try {
      const response = await fetch(`${this.marqoHost}/indexes`, {
        method: "GET",
      });

      return response.json();
    } catch (error) {
      console.error("Erro:", error);
      throw error;
    }
  }

  async addDocument(
    document: MarqoDocument,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.marqoHost}/indexes/${this.marqoIndex}/documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documents: [document],
            tensorFields: ["title", "description"],
            metadata,
          }),
        },
      );

      return response.json();
    } catch (error) {
      console.error("Erro ao adicionar documento:", error);
      throw error;
    }
  }

  async getDocument(documentId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.marqoHost}/indexes/${this.marqoIndex}/documents/${documentId}`,
        {
          method: "GET",
        },
      );

      return response.json();
    } catch (error) {
      console.error("Erro:", error);
      throw error;
    }
  }

  async search(query: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.marqoHost}/indexes/${this.marqoIndex}/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: query,
            searchableAttributes: ["title"],
          }),
        },
      );

      return response.json();
    } catch (error) {
      console.error("Erro:", error);
      throw error;
    }
  }
}

export { Marqo };
