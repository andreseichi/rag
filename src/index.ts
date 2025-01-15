import { RAG } from "./Rag";
import readline from "node:readline";

const main = async (): Promise<void> => {
  const config = {
    ollama: {
      host: "http://localhost:11434",
      model: "llama3.1",
      embeddingModel: "nomic-embed-text",
    },
    redisUrl: "redis://localhost:6379",
  };

  const rag = new RAG(config.ollama, config.redisUrl);

  try {
    await rag.init();

    const userInput = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    userInput.question("Qual sua dúvida com suas finanças?", async (input) => {
      userInput.close();
      const generatedResponse = await rag.generateResponse(input);
      console.log(generatedResponse);
    });
  } catch (error) {
    console.error("Erro:", error);
  } finally {
  }
};

main();
