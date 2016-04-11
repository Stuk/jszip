/* jshint qunit: true */
/* global JSZip,JSZipTestUtils */
'use strict';

QUnit.module("external");

function createPromiseProxy(OriginalPromise) {
    function MyShinyPromise () {
        OriginalPromise.apply(this, arguments);
        MyShinyPromise.calls++;
    }
    MyShinyPromise.calls = 0;
    MyShinyPromise.prototype = OriginalPromise.prototype;
    function proxyMethod(method) {
        if (typeof OriginalPromise[method] === "function") {
            MyShinyPromise[method] = function () {
                MyShinyPromise.calls++;
                return OriginalPromise[method].apply(OriginalPromise, arguments);
            };
        }
    }
    MyShinyPromise.prototype.isACustomImplementation = true;
    for(var method in OriginalPromise) {
        if (!OriginalPromise.hasOwnProperty(method)) {
            continue;
        }
        proxyMethod(method);
    }
    return MyShinyPromise;
}

test("external.Promise can be replaced in .async()", function (assert) {
    var done = assert.async();
    var OriginalPromise = JSZip.external.Promise;
    var MyShinyPromise = createPromiseProxy(OriginalPromise);

    JSZip.external.Promise = MyShinyPromise;

    var promise = JSZipTestUtils.createZipAll().file("Hello.txt").async("string").then(function (result) {
        ok(MyShinyPromise.calls > 0, "at least 1 call of the new Promise");
        JSZip.external.Promise = OriginalPromise;
        done();
    })['catch'](JSZipTestUtils.assertNoError);

    assert.ok(promise.isACustomImplementation, "the custom implementation is used");
});

test("external.Promise can be replaced in .generateAsync()", function (assert) {
    var done = assert.async();
    var OriginalPromise = JSZip.external.Promise;
    var MyShinyPromise = createPromiseProxy(OriginalPromise);

    JSZip.external.Promise = MyShinyPromise;

    var promise = JSZipTestUtils.createZipAll().generateAsync({type:"string"}).then(function (result) {
        ok(MyShinyPromise.calls > 0, "at least 1 call of the new Promise");
        JSZip.external.Promise = OriginalPromise;
        done();
    })['catch'](JSZipTestUtils.assertNoError);

    assert.ok(promise.isACustomImplementation, "the custom implementation is used");
});

JSZipTestUtils.testZipFile("external.Promise can be replaced in .loadAsync()", "ref/all.zip", function (all) {
    stop();
    var OriginalPromise = JSZip.external.Promise;
    var MyShinyPromise = createPromiseProxy(OriginalPromise);

    JSZip.external.Promise = MyShinyPromise;

    var promise = JSZip.loadAsync(all).then(function (result) {
        ok(MyShinyPromise.calls > 0, "at least 1 call of the new Promise");
        JSZip.external.Promise = OriginalPromise;
        start();
    })['catch'](JSZipTestUtils.assertNoError);

    ok(promise.isACustomImplementation, "the custom implementation is used");
});
