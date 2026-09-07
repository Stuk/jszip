"use strict";

// Browser-only: simulates extension / iframe contexts where binary types come from
// another JavaScript realm and fail instanceof checks against the page globals.

QUnit.module("cross-realm type detection");

function evalFromIframe(source) {
    var iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    var value = iframe.contentWindow.eval(source);
    document.body.removeChild(iframe);
    return value;
}

QUnit.test("zip.file accepts ArrayBuffer from an iframe realm", function (assert) {
    return new JSZip().file("test.bin", evalFromIframe("new ArrayBuffer(4)"))
        .generateAsync({type: "uint8array"})
        .then(function (result) {
            assert.ok(result.byteLength > 0);
        });
});

QUnit.test("zip.file accepts Uint8Array from an iframe realm", function (assert) {
    return new JSZip().file("test.bin", evalFromIframe("new Uint8Array(4)"))
        .generateAsync({type: "uint8array"})
        .then(function (result) {
            assert.ok(result.byteLength > 0);
        });
});
