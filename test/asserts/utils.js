"use strict";

// These tests only run in Node
var utils = require("../../lib/utils");

QUnit.module("utils");

QUnit.test("Paths are resolved correctly", function (assert) {
    // Backslashes can be part of filenames
    assert.strictEqual(utils.resolve("root\\a\\b"), "root\\a\\b");
    assert.strictEqual(utils.resolve("root/a/b"), "root/a/b");
    assert.strictEqual(utils.resolve("root/a/.."), "root");
    assert.strictEqual(utils.resolve("root/a/../b"), "root/b");
    assert.strictEqual(utils.resolve("root/a/./b"), "root/a/b");
    assert.strictEqual(utils.resolve("root/../../../"), "");
    assert.strictEqual(utils.resolve("////"), "/");
    assert.strictEqual(utils.resolve("/a/b/c"), "/a/b/c");
    assert.strictEqual(utils.resolve("a/b/c/"), "a/b/c/");
    assert.strictEqual(utils.resolve("../../../../../a"), "a");
    assert.strictEqual(utils.resolve("../app.js"), "app.js");
});
