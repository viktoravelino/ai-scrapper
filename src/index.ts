import { program } from "commander";
// import figlet from "figlet";
import { createData } from "./scripts/create-data";
import { prepareDocs } from "./scripts/prepare-docs";

import { fetchSelectorsOpenAI } from "./scripts/openAI";
import { OpenAIEmbeddings } from "@langchain/openai";

// console.log(figlet.textSync("Dir Manager"));

async function run(url: string) {
  const docsCreated = await createData(url);

  const embeddings = new OpenAIEmbeddings();
  const vectorStore = await prepareDocs(docsCreated, embeddings);

  const selectors = await fetchSelectorsOpenAI(vectorStore, {
    target: "button",
  });

  console.log("Selectors: ", selectors);

  process.exit(0);
}

async function main() {
  program
    .name("screenshot-scraper")
    .description("CLI to take screenshots of elements on a webpage")
    .version("0.0.1");

  program
    .argument("<url>", "URL of the webpage to take screenshots of")
    .action(run);

  await program.parseAsync(process.argv);
}

main();
