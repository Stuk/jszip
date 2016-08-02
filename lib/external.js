'use strict';

// load the global object first:
// - it should be better integrated in the system (unhandledRejection in node)
// - the environment may have a custom Promise implementation (see zone.js)
var ES6Promise = global.Promise || require("lie");

/**
 * Let the user use/change some implementations.
 */
module.exports = {
    Promise: ES6Promise
};
