import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { getPineconeClient } from "../lib/pinecone-client";

import { data } from "../data";

async function embedAndStoreDocs(
  client: Pinecone,
  docs: Parameters<typeof PineconeStore.fromDocuments>[0]
) {
  try {
    const embeddings = new OpenAIEmbeddings();
    const index = client.Index(process.env.PINECONE_INDEX!);

    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
    });
  } catch (error) {
    console.log("error ", error);
    throw new Error("Failed to load your docs !");
  }
}

(async () => {
  try {
    const pineconeClient = await getPineconeClient();
    console.log(`Using data.ts docs, and loading chunks into pinecone...`);
    await embedAndStoreDocs(pineconeClient, data);
    console.log("Data embedded and stored in pine-cone index");
  } catch (error) {
    console.error("Init client script failed ", error);
  }
})();
