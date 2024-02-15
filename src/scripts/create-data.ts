import * as cheerio from "cheerio";
import beautify from "js-beautify";

// const url = "https://mui.com/joy-ui/react-button/";

export async function fetchHtmlAndCreateDataFile(url: string) {
  try {
    console.log("Fetching the page...");
    const response = await fetch(url);
    const htmlString = await response.text();

    console.log("Parsing the page...");
    const $ = cheerio.load(htmlString);

    // remove all scripts, head, and style tags
    $("script").remove();
    $("head").remove();
    $("style").remove();
    $("pre").remove();
    $("code").remove();
    $("path").remove();
    $("rect").remove();
    $("use").remove();
    $("symbol").remove();

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
      .map((line) => line.trim()) // trim each line
      .filter(
        (trimmedLine) => trimmedLine.length > 0 && trimmedLine.charAt(0) === "<"
      );

    // create an array of objects with the metadata and the page content
    const docs = docLines.map((line) => {
      const trimmedLine = line.trim();
      const elementName = trimmedLine
        .replace(">", " ")
        .split(" ")[0]
        .replace("<", "");

      const attributes: string[] = [];

      const classMatch = trimmedLine.match(/class="([^"]*)"/);
      if (classMatch) {
        const [, classes] = classMatch;
        attributes.push(
          `and contains the following classes: '${classes.replace(/ /g, ", ")}'`
        );
      }

      const idMatch = trimmedLine.match(/ id="([^"]*)"/);
      if (idMatch) {
        const [, id] = idMatch;
        attributes.push(`and it has the id of '${id}'`);
      }

      return {
        metadata: {
          content: `This element is '${elementName}' ${
            attributes.length > 0 ? attributes.join(", ") : ""
          }`.trim(),
        },
        pageContent: trimmedLine,
      };
    });

    console.log("✅ Data created!");
    return docs;
  } catch (error) {
    console.error("Error creating data file: ", error);
    process.exit(1);
  }
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
