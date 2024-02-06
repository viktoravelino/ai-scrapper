import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClientInstance: Pinecone | null = null;

export async function getPineconeClient() {
  if (pineconeClientInstance === null) {
    pineconeClientInstance = new Pinecone();
  }
  return pineconeClientInstance;
}
