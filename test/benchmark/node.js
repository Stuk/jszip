"use strict";

globalThis.Benchmark = require("benchmark");
globalThis.JSZip = require("../../lib/index");

const benchmark = require("./benchmark");
benchmark("nodebuffer");
