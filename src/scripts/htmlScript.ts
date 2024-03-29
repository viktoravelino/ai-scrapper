import * as cheerio from "cheerio";
import fs from "fs";
import beautify from "js-beautify";

const url = "https://mui.com/joy-ui/react-button/";

export async function createData() {
  const response = await fetch(url);
  const htmlString = await response.text();

  const $ = cheerio.load(htmlString);

  const pageTitle = $("title").text();

  $("script").remove();
  $("head").remove();
  $("style").remove();
  $("pre").remove();

  // get the main tag
  const main = $("main");
  // remove all children of the main tag
  $("main").remove();

  // get the body tag
  const body = $("body");

  // get the children of the body tag
  const bodyElements = checkChildren($, body);
  // get the children of the main tag
  const mainElements = checkChildren($, main);

  // beautify the html
  const beautifiedHtml = beautify.html(bodyElements + mainElements, {
    indent_size: 2,
    inline: [], // don't inline any tags
    inline_custom_elements: true,
  });

  const docLines = beautifiedHtml
    .replace(/<\/[^>]+>/g, "") // remove all closing tags
    .split("\n") // create an array of lines
    .filter((line) => line.trim().length > 0) // remove all empty lines
    .filter((line) => line.trim().charAt(0) === "<")
    .filter((line) => !line.trim().startsWith("<path"))
    .filter((line) => !line.trim().startsWith("<rect"))
    .filter((line) => !line.trim().startsWith("<use"))
    .filter((line) => !line.trim().startsWith("<code"))
    .filter((line) => !line.trim().startsWith("<symbol"));
  // remove all lines that are not html elements

  const docs = docLines.map((line) => {
    const elementName = line.trim().split(" ")[0].replace("<", "");

    const attributes: string[] = [];

    const classSelector = "class=";

    if (line.includes(classSelector)) {
      const classes = line
        .split(classSelector)[1]
        .split('"')[1]
        .split(" ")
        .join(", ");
      attributes.push(`and contains the following classes: '${classes}'`);
    }

    const idSelector = " id=";
    if (line.includes(idSelector)) {
      const id = line.split(idSelector)[1].split('"')[1];
      attributes.push(`and it has the id of '${id}'`);
    }

    return {
      metadata: {
        // source: url,
        content: `This element is '${elementName}' ${
          attributes.length > 0 && attributes.join(", ")
        }`,
      },
      pageContent: line.trim(),
    };
  });

  fs.writeFileSync(
    "src/data.ts",
    `export const data = ${JSON.stringify(docs, null, 2)}`
  );

  fs.writeFileSync("src/html.html", docLines.join("\n"));
}

// crazy recursive function to get the html of the children of the element
function checkChildren(
  $: cheerio.CheerioAPI,
  el: cheerio.Cheerio<cheerio.Element>
) {
  if (el.children().length === 1) {
    return checkChildren($, $(el.children()[0]));
  } else {
    return el.html() ?? "";
  }
}

createData();
