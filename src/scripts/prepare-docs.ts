import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

export async function prepareDocsIntoVectorStore(
  docs: Parameters<typeof MemoryVectorStore.fromDocuments>[0],
  embeddings: OpenAIEmbeddings,
) {
  try {
    console.log("Embedding and storing docs...");
    const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
    console.log("✅ Docs embedded and stored!");
    return vectorStore;
  } catch (error) {
    console.log("Error loading vector store:  ", error);
    process.exit(1);
  }
}
