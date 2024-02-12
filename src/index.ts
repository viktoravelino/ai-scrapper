import { program } from "commander";
import { fetchHtmlAndCreateDataFile } from "./scripts/create-data";
import { prepareDocsIntoVectorStore } from "./scripts/prepare-docs";

import { fetchSelectorsFromOpenAI } from "./scripts/openAI";
import { OpenAIEmbeddings } from "@langchain/openai";
import { screenshotComponents } from "./scripts/screenshot";
import { input } from "@inquirer/prompts";
import dotenv from "dotenv";
dotenv.config();

async function run(url: string, target: string) {
  // fetch the html and create a data file
  const docsCreated = await fetchHtmlAndCreateDataFile(url);

  const embeddings = new OpenAIEmbeddings();

  // prepare the docs into a vector store
  const vectorStore = await prepareDocsIntoVectorStore(docsCreated, embeddings);

  // fetch the selectors from openai
  const selectors = await fetchSelectorsFromOpenAI(vectorStore, {
    target,
  });

  while (true) {
    const continueScreenshot = await input({
      message: "Would you like to continue taking screenshots? (y/n): ",
    });
    if (continueScreenshot === "n") {
      process.exit(0);
    }

    if (continueScreenshot === "y") {
      break;
    }

    console.log("Invalid input, please try again");
  }

  await screenshotComponents(url, target, selectors);

  process.exit(0);
}

async function main() {
  program
    .name("screenshot-scraper")
    .description("CLI to take screenshots of elements on a webpage")
    .version("0.0.1");

  program
    .argument("<url>", "URL of the webpage to take screenshots of")
    .argument("<target>", "The type of element to take screenshots of")
    .action(run);

  await program.parseAsync(process.argv);
}

main();
