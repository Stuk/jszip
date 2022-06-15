"use strict";

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
async function runBrowser(browserType, waitFor, file) {
    console.log("Starting", browserType);
    const browser = await playwright[browserType].launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`http://127.0.0.1:8080/test/${file}`);
    const result = await waitFor(page);

    console.log("Closing", browserType);
    await browser.close();

    return [browserType, result];
}

async function runBrowsers(waitFor, file) {
    const browsersTypes = ["chromium", "firefox", "webkit"];

    const server = createServer({root: path.join(__dirname, "..")});
    await new Promise(resolve => server.listen(8080, "127.0.0.1", resolve));
    console.log("Server started");

    try {
        const results = await Promise.all(browsersTypes.map(b => runBrowser(b, waitFor, file)));
        return results;
    } finally {
        server.close();
    }
}

async function waitForTests(page) {
    let result;
    do {
        result = await page.evaluate(() => {
            return window.global_test_results;
        });
    } while (!result);
    return result;
}

async function runTests() {
    const results = await runBrowsers(waitForTests, "index.html?hidepassed");

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
}

async function waitForBenchmark(page) {
    return new Promise(resolve => {
        const logs = [];

        page.on("console", async message => {
            if (message.text() === "Benchmark complete") {
                resolve(logs);
            } else {
                logs.push(message.text());
            }
        });
    });
}

async function runBenchmark() {
    const results = await runBrowsers(waitForBenchmark, "benchmark/index.html");

    for (const [browser, logs] of results) {
        for (const log of logs) {
            console.log(browser, log);
        }
    }
}

switch (process.argv[2]) {
case "--test":
    runTests();
    break;
case "--benchmark":
    runBenchmark();
    break;
default:
    throw new Error(`Unknown argument: ${process.argv[2]}`);
}
