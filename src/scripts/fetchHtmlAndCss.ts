import puppeteer, { ElementHandle } from "puppeteer";
import * as cheerio from "cheerio";
import css from "css";
import * as fs from "fs";

interface Position {
  start: {
    line: number;
    column: number;
  };
  end: {
    line: number;
    column: number;
  };
}

interface Rule {
  type: "rule";
  selectors: string[];
  declarations: Declaration[];
}

interface Declaration {
  type: "declaration";
  property: string;
  value: string;
  position: Position;
}

const mockClasses = `
.test {
    --Icon-margin: initial;
    --Icon-color: currentColor;
    min-height: var(--Button-minHeight, 2rem);
    font-size: var(--joy-fontSize-sm);
}

.css-18lygt3 {
    --Icon-margin: initial;
    --Icon-color: currentColor;
    --Icon-fontSize: var(--joy-fontSize-lg);
    --CircularProgress-size: 20px;
    --CircularProgress-thickness: 2px;
    --Button-gap: 0.375rem;
    min-height: var(--Button-minHeight, 2rem);
    font-size: var(--joy-fontSize-sm);
    padding-block: var(--Button-paddingBlock, 0.25rem);
    padding-inline: 0.75rem;
    -webkit-tap-highlight-color: transparent;
    box-sizing: border-box;
    border-radius: var(--Button-radius, var(--joy-radius-sm));
    margin: var(--Button-margin);
    border: none;
    background-color: transparent;
    cursor: pointer;
    display: -webkit-inline-box;
    display: -webkit-inline-flex;
    display: -ms-inline-flexbox;
    display: inline-flex;
    -webkit-align-items: center;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    -webkit-justify-content: center;
    justify-content: center;
    position: relative;
    -webkit-text-decoration: none;
    text-decoration: none;
    font-family: var(--joy-fontFamily-body);
    font-weight: var(--joy-fontWeight-lg);
    line-height: var(--joy-lineHeight-md);
    --variant-borderWidth: 0px;
    color: var(--variant-solidColor, var(--joy-palette-primary-solidColor, var(--joy-palette-common-white, #FFF)));
    background-color: var(--variant-solidBg, var(--joy-palette-primary-solidBg, var(--joy-palette-primary-500, #0B6BCB)));
  }
  
  .css-18lygt3.Mui-focusVisible,
  .css-18lygt3:focus-visible {
    outline-offset: var(--focus-outline-offset, var(--joy-focus-thickness, 2px));
    outline: var(--joy-focus-thickness, 2px) solid var(--joy-palette-focusVisible, #0B6BCB);
  }
  
  .css-18lygt3:active,
  .css-18lygt3[aria-pressed="true"] {
    background-color: var(--variant-solidActiveBg, var(--joy-palette-primary-solidActiveBg, var(--joy-palette-primary-700, #12467B)));
  }
  
  .css-18lygt3.Mui-disabled {
    pointer-events: none;
    cursor: default;
    --Icon-color: currentColor;
    color: var(--variant-solidDisabledColor, var(--joy-palette-primary-solidDisabledColor, var(--joy-palette-neutral-400, #9FA6AD)));
    background-color: var(--variant-solidDisabledBg, var(--joy-palette-primary-solidDisabledBg, var(--joy-palette-neutral-100, #F0F4F8)));
  }
  
  .css-18lygt3.MuiButton-loading {
    color: transparent;
  }`;

(async () => {
  //   const browser = await puppeteer.launch({ headless: "new" });
  //   const page = await browser.newPage();

  //   await page.goto("https://mui.com/joy-ui/react-button/");

  //   //   // Extract CSS rules dynamically imported via JavaScript
  //   const dynamicCssRules = await page.evaluate(() => {
  //     const styleElements = Array.from(document.querySelectorAll("style"));
  //     return styleElements.map((element) => element.textContent).join("\n");
  //   });

  const parsedDynamicCss = css.parse(mockClasses);

  // TODO: receive as an argument
  const classes = ["test", "css-18lygt3"];

  const cssRules = getRulesByClassSelector(classes, parsedDynamicCss);

  const declarationsArray = createArrayOfUniqueDeclarations(cssRules);

  const stringifiedRules = stringifyRules([
    {
      type: "rule",
      selectors: [".test"], // maybe change to be the target name
      declarations: declarationsArray,
    },
  ]);

  console.log(stringifiedRules);

  //   await browser.close();
})();

function stringifyRules(rules: css.Rule[]) {
  return css.stringify({
    type: "stylesheet",
    stylesheet: { rules },
  });
}

function getRulesByClassSelector(
  classes: string[],
  parsedDynamicCss: css.Stylesheet
): Rule[] {
  return classes.reduce((acc, classSelector) => {
    const classRules = parsedDynamicCss?.stylesheet?.rules.filter((rule) => {
      const ruleCopy = rule as Rule; // just to fiz TS errors

      return (
        ruleCopy.type === "rule" &&
        ruleCopy.selectors.some(
          (selector: string) => selector === `.${classSelector}` // it does not include other states like :hover, :active, etc.
        )
      );
    }) as Rule[];

    return [...acc, ...classRules];
  }, [] as Rule[]);
}

function createArrayOfUniqueDeclarations(rules: Rule[]) {
  return Array.from(
    rules
      .reduce((acc, rule) => {
        rule.declarations.forEach((declaration) => {
          acc.set(declaration.property, declaration);
        });

        return acc;
      }, new Map<string, Declaration>())
      .values()
  );
}

// (async () => {
//   const browser = await puppeteer.launch({ headless: "new" });
//   const page = await browser.newPage();

//   await page.goto("https://mui.com/joy-ui/react-button/");

//   //   // Extract CSS rules dynamically imported via JavaScript
//   const dynamicCssRules = await page.evaluate(() => {
//     const styleElements = Array.from(document.querySelectorAll("style"));
//     return styleElements.map((element) => element.textContent).join("\n");
//   });

//   const parsedDynamicCss = css.parse(dynamicCssRules);

//   //   // Filter and extract CSS rules associated with a specific class or selector
//   const classSelector = ".css-18lygt3";
//   const classRules = parsedDynamicCss?.stylesheet?.rules.filter((rule) => {
//     if (rule.type === "rule") {
//       // @ts-ignore
//       return rule.selectors.some((selector) =>
//         selector.includes(classSelector)
//       );
//     }
//     return false;
//   });

//   console.log(stringifyRules(classRules!));

//   await browser.close();
// })();
