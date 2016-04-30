'use strict';

var ES6Promise = require("es6-promise").Promise;
var delay = require("./utils").delay;

/**
 * Let the user use/change some implementations.
 */
module.exports = {
    Promise: ES6Promise,
    delay: delay
};
