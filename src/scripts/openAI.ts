import { OpenAI } from "@langchain/openai";
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
import { formatDocumentsAsString } from "langchain/util/document";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

const METADATA_PROMPT = `
You are a helpful code debugger.
You are an expert at helping users find elements in the DOM based on their instructions.
You will receive HTML and you are to find all DOM elements that you think might match the type of element they're looking for.
If they ask you to find all "button" elements, you would look for all button tags, but also look at the class names and ids of all elements and see if they indicate a button. 
For example, mui components may have the classes "MuiButton-root" and "MuiButton-variantSolid" among others. 
Other components libraries and custom elements will have their own. 
Use your best judgement and return an array of matching tags and query selectors from the documents provided.
It is VERY important that you only return an json that identifies matching selectors. 
If you return anything else, the user will be very confused and will not be able to complete their task. 
This is the desired format: array of objects with as an example "selectors": [".MuiButton-root", ".MuiButton-variantSolid"].
If you are unable to find any matching elements within the documents, return an empty array.


Use this html elements to find the elements: {html}.

Be aware that the html elements may contain classes and ids that may help you identify the elements.
Also, each element only contains the opening tag, so you will have to use your best judgement to identify the elements.
`;

export async function fetchSelectorsFromOpenAI(
  vectorStore: MemoryVectorStore,
  { target }: { target: string }
) {
  try {
    console.log("Fetching selectors...");

    const model = new OpenAI({
      modelName: "gpt-3.5-turbo-1106",
      temperature: 0.5,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      maxTokens: 256,
      modelKwargs: {
        response_format: { type: "json_object" },
      },
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

    console.log("Invoking chain...");
    const answer = await chain.invoke(target);

    console.log("Chain response: ", answer);

    // try to parse the answer as json and return it
    // if it fails, convert to an array
    try {
      const parsedAnswer = JSON.parse(answer);
      return parsedAnswer.selectors;
    } catch (error) {
      // grab the first array of selectors from the response or the second if the first is empty
      let selectors = answer.split("[")[2];

      if (selectors === undefined) {
        selectors = answer.split("[")[1];
      }

      return selectors
        .replace(/"/g, "")
        .split(",")
        .filter((selector) => selector.trim().length > 1)
        .map((selector) => selector.trim());
    }
  } catch (error) {
    console.error("Error fetching selectors: ", error);
    process.exit(1);
  }
}
