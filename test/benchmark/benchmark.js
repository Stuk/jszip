"use strict";

(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.benchmark = factory();
    }
}(typeof self !== "undefined" ? self : this, function () {
    return function (type) {
        return new Promise(resolve => {
            const suite = new Benchmark.Suite();

            suite
                .add(`${type} generateAsync`, {
                    defer: true,
                    async fn(deferred) {
                        const zip = new JSZip();

                        for (let i = 0; i < 50; i++) {
                            zip.file("file_" + i, "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=", { base64: true, date: new Date(1234123491011) });
                        }

                        await zip.generateAsync({ type });
                        deferred.resolve();
                    }
                })
                .on("cycle", event => {
                    // Output benchmark result by converting benchmark result to string
                    console.log(String(event.target));
                })
                .on("complete", () => {
                    console.log("Benchmark complete");
                    resolve();
                })
                .run({ "async": true });
        });
    };
}));
