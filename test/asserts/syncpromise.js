/* jshint qunit: true */
/* global JSZip,JSZipTestUtils */
'use strict';
var SyncPromise = require("../../../lib/promise/SyncPromise").SyncPromise;

QUnit.module("SyncPromise");

test("Fulfilling a promise", function(assert) {
    var promise = new SyncPromise(function(resolve, reject){
        resolve("ok");
    });
    assert.ok("ok"===promise.result());
});

test("Rejecting a promise", function(assert) {
    var promise = new SyncPromise(function(resolve, reject){
        reject("nok");
    });
    promise.get();
    assert.ok("nok"===promise.error());
});

test("Throwing an error", function(assert) {
    assert.throws(function() {
        var promise = new SyncPromise(function(resolve, reject){
            var a = b.c;
        });
        promise.result(); },
        Error);
});

test("Thening a promise", function(assert) {
    var promise = new SyncPromise(function(resolve, reject){
        resolve("ok1");
    }).then(function(value, reason){
        return "ok2";
    });
    assert.ok("ok2"===promise.result());
});