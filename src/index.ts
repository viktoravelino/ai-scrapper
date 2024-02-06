import { PineconeStore } from "@langchain/pinecone";
import { OpenAI, OpenAIEmbeddings } from "@langchain/openai";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Pinecone } from "@pinecone-database/pinecone";
import { formatDocumentsAsString } from "langchain/util/document";

const METADATA_PROMPT = `
You are a helpful code debugger.
You are an expert at helping users find elements in the DOM based on their instructions.
You will receive HTML and you are to find all DOM elements that you think might match the type of element they're looking for.
If they ask you to find all "button" elements, you would look for all button tags, but also look at the class names and ids of all elements and see if they indicate a button. 
For example, mui components may have the classes "MuiButton-root" and "MuiButton-variantSolid" among others. 
Other components libraries and custom elements will have their own. 
Use your best judgement and return an array of matching tags and query selectors from the documents provided.
It is VERY important that you only return an json that identifies matching tags and selectors. 
If you return anything else, the user will be very confused and will not be able to complete their task. 
This is the desired format: array of objects with as an example "tags": ["button"], "selectors": [".MuiButton-root", ".MuiButton-variantSolid"].
If you are unable to find any matching elements within the documents, return an empty array.


Use this html elements to find the elements: {html}.

Be aware that the html elements may contain classes and ids that may help you identify the elements.
Also, each element only contains the opening tag, so you will have to use your best judgement to identify the elements.
`;

async function main() {
  const pineconeClient = new Pinecone();
  const embeddings = new OpenAIEmbeddings({});

  const index = pineconeClient.Index(process.env.PINECONE_INDEX!);

  const model = new OpenAI({
    modelName: "gpt-3.5-turbo-1106",
    temperature: 0.5,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    maxTokens: 256,
  });

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index,
  });

  const vectorStoreRetriever = vectorStore.asRetriever({
    k: 100,
  });

  const messages = [
    SystemMessagePromptTemplate.fromTemplate(METADATA_PROMPT),
    HumanMessagePromptTemplate.fromTemplate(
      "Please find all elements of this type {target}"
    ),
  ];

  const prompt = ChatPromptTemplate.fromMessages(messages);

  const chain = RunnableSequence.from([
    {
      html: vectorStoreRetriever.pipe(formatDocumentsAsString),
      target: new RunnablePassthrough(),
    },
    prompt,
    model,
    new StringOutputParser(),
  ]);

  const answer = await chain.invoke("button");

  console.log(answer);
}

// function parseDocs(docs: Document[]) {
//   return docs
//     .map((doc) => {
//       // console.log(doc);
//       return doc.pageContent;
//     })
//     .join("\n");
// }

main();
