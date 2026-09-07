"use strict";

// These tests only run in Node
var vm = require("vm");
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

QUnit.module("utils - cross-realm type detection");

QUnit.test("getTypeOf recognizes ArrayBuffer from another realm", function (assert) {
    var foreignArrayBuffer = vm.runInNewContext("new ArrayBuffer(8)");
    assert.strictEqual(utils.getTypeOf(foreignArrayBuffer), "arraybuffer");
});

QUnit.test("getTypeOf recognizes Uint8Array from another realm", function (assert) {
    var foreignUint8Array = vm.runInNewContext("new Uint8Array(8)");
    assert.strictEqual(utils.getTypeOf(foreignUint8Array), "uint8array");
});
