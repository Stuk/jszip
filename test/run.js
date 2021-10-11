const path = require("path");
const playwright = require("playwright");
const createServer = require("http-server").createServer;

/** @typedef {{
      name: string,
      message: string,
      module: string,
      result: boolean,
      expected: unknown,
      actual: unknown,
      source: string
    }} Failure
*/

/**
 * @typedef {{ passed: number, failed: number, total: number, runtime: number, tests: Failure[] }} Results
 */

/**
 * @param {string} browserType
 * @returns {Promise<[string, Results]>}
 */
async function run(browserType) {
    console.log("Starting", browserType);
    const browser = await playwright[browserType].launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`http://127.0.0.1:8080/test/index.html?hidepassed`);

    let result;
    do {
        result = await page.evaluate(() => {
            return window.global_test_results;
        });
    } while (!result)

    console.log("Closing", browserType);
    await browser.close();

    return [browserType, result];
}

async function main() {
    const browsersTypes = ["chromium", "firefox", "webkit"];

    const server = createServer({root: path.join(__dirname, "..")});
    await new Promise(resolve => server.listen(8080, "127.0.0.1", resolve));
    console.log("Server started");

    try {
        const results = await Promise.all(browsersTypes.map(run));

        let failures = false;
        for (const result of results) {
            console.log(...result);
            failures = failures || result[1].failed > 0;
        }

        if (failures) {
            console.log("Tests failed");
            process.exit(1);
        } else {
            console.log("Tests passed!");
        }
    } finally {
        server.close();
    }
}

main();
