import { join } from "path";
import * as fs from "fs";
import puppeteer, { ElementHandle } from "puppeteer";
import { asyncFilter } from "../utils/asyncFilter";

export async function screenshotComponents(
  url: string,
  target: string,
  selectors: string[]
) {
  console.log({
    url,
    target,
    selectors,
  });
  console.log("Removing old images...");
  fs.readdirSync(join(__dirname, "images")).forEach((file) => {
    // if (file.endsWith(".png")) {
    fs.unlinkSync(join(__dirname, "images", file));
    // }
  });
  console.log("✅ Done removing old images");

  console.log("Initiating puppeteer browser...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(url);
  await page.setViewport({ width: 1080, height: 1024 });

  // wait for all initial animations to finish
  console.log("🤔 Awaiting animations...");
  await new Promise((r) => setTimeout(r, 5000));

  console.log("📷  Taking screenshots...");
  let elementsToScreenShot: ElementHandle<Element>[] = [];

  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i];
    console.log("🔍 Searching for: ", selector);
    const elements = await page.$$(selector);
    elementsToScreenShot.push(...elements);
  }

  console.log("Elements found in DOM: " + elementsToScreenShot.length);

  const filtered = await asyncFilter(elementsToScreenShot, async (el) => {
    const hasContent =
      ((await el.evaluate((el) => el.textContent)) !== "" ||
        (await el.evaluate((el) => el.textContent))) !== " ";
    if (!hasContent) {
      console.log("no content");
      return false;
    }
    return true;
  });

  console.log("Elements with content: " + filtered.length);

  const elementMap = new Map<
    string,
    {
      element: ElementHandle<Element>;
      index: number;
    }
  >();
  for (let i = 0; i < filtered.length; i++) {
    const element = filtered[i];
    const classes = (
      await element.evaluate((el) => el.classList.toString())
    )?.trim();
    const textContent = (
      await element.evaluate((el) => el.textContent)
    )?.trim();
    // improve uniqueness
    const uniqueString = `${textContent} ${classes}`;
    // skip buttons that have already been screenshot

    if (!(await element.isVisible())) {
      continue;
    }
    // if (elementSet.has(uniqueString) || !(await element.isVisible())) {
    //   continue;
    // }
    elementMap.set(uniqueString, {
      element,
      index: i,
    });
  }

  console.log("Unique elements with content: " + elementMap.size);

  console.log("Taking screenshots of elements...");

  const promises = Array.from(elementMap).map(
    async ([, { element, index }]) => {
      await element
        .screenshot({
          path: join(__dirname, "images", `${target}-${index}.png`),
        })
        .catch((err) => {
          console.log(
            'Button not in page; "Might be a11n or in a modal or different viewport": ',
            err
          );
        });

      // save classNames to a file
      const classNames = await element.evaluate((el) =>
        el.classList.toString()
      );
      fs.writeFileSync(
        join(__dirname, "images", `${target}-${index}.txt`),
        classNames
      );
    }
  );

  await Promise.all(promises);

  await browser.close();
  console.log("✅ Done taking screenshots");
}
