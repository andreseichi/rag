import { Marqo } from "./Marqo";
import { RAG } from "./Rag";

const main = async (): Promise<void> => {
  const config = {
    ollama: {
      host: "http://localhost:11434",
      model: "llama3.2",
    },
    marqo: {
      host: "http://localhost:8882",
      index: "documentos",
    },
    redisUrl: "redis://localhost:6379",
  };

  const marqo = new Marqo(config.marqo);
  const rag = new RAG(config.ollama, config.redisUrl);

  try {
    const userPrompt = "carne";
    // const response = await rag.generateEmbedding(userPrompt);

    // console.log("Resposta:", response);
    // file mignon, bolo de chocolate, salada de batata com ovo

    const receita = {
      title: "salada de batata com ovo",
      description: `
      Ingredientes:
        6 batatas cozidas com casca
        4 ovos cozidos
        1 cebola-roxa picada
        50 gramas de azeitonas verdes
        Suco de limão a gosto
        Azeite de oliva a gosto
        Sal a gosto
        Pimenta-do-reino a gosto
        Ervas picadas a gosto
      Modo de preparo:
        Descasque e corte as batatas e os ovos em cubos.
        Disponha em uma tigela ou saladeira, junte a cebola e a azeitona e reserve.
        Em um pote separado, faça um molho com os demais ingredientes e regue a salada.
        Misture delicadamente e leve para gelar antes de servir decorada a gosto.
`,
    };

    const document1 = {
      id: "1",
      content:
        "salada de batata com ovo.\nIngredientes: 6 batatas cozidas com casca, 4 ovos cozidos, 1 cebola-roxa picada, 50 gramas de azeitonas verdes, Suco de limão a gosto, Azeite de oliva a gosto, Sal a gosto, Pimenta-do-reino a gosto, Ervas picadas a gosto.\nModo de preparo: Descasque e corte as batatas e os ovos em cubos. Disponha em uma tigela ou saladeira, junte a cebola e a azeitona e reserve. Em um pote separado, faça um molho com os demais ingredientes e regue a salada. Misture delicadamente e leve para gelar antes de servir decorada a gosto.",
    };

    // const response = await marqo.search(userPrompt);

    await rag.init();

    await rag.addDocument(document1);

    const response = rag.search("batata");

    console.log("Resposta:", JSON.stringify(response, null, 2));
  } catch (error) {
    console.error("Erro:", error);
  } finally {
  }
};

main();
