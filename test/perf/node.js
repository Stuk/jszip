"use strict";

globalThis.Benchmark = require("benchmark");
globalThis.JSZip = require("../../lib/index");

const run = require("./perf");
run("nodebuffer");
