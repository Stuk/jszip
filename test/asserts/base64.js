"use strict";

var base64 = require("../../lib/base64");
var utf8 = require("../../lib/utf8");

QUnit.module("base64");

QUnit.test("encode a non-ASCII string as UTF-8", function(assert) {
    // https://github.com/Stuk/jszip/issues/950
    assert.equal(base64.encode("✓"), "4pyT", "check mark");
    assert.equal(base64.encode("café"), "Y2Fmw6k=", "accented text");
    assert.equal(base64.encode("\uD83D\uDCA9"), "8J+SqQ==", "emoji (surrogate pair)");
    assert.equal(base64.encode("Iñtërnâtiônàlizætiøn☃\uD83D\uDCA9"), "ScOxdMOrcm7DonRpw7Ruw6BsaXrDpnRpw7hu4piD8J+SqQ==", "mixed multi-byte string");
});

QUnit.test("encode an ASCII string is unchanged", function(assert) {
    assert.equal(base64.encode("test"), "dGVzdA==", "ascii text");
    assert.equal(base64.encode(""), "", "empty string");
});

QUnit.test("encode a byte array is unchanged", function(assert) {
    assert.equal(base64.encode([0xE2, 0x9C, 0x93]), "4pyT", "array of UTF-8 bytes");
    assert.equal(base64.encode(new Uint8Array([0xE2, 0x9C, 0x93])), "4pyT", "Uint8Array of UTF-8 bytes");
    assert.equal(base64.encode([116, 101, 115, 116]), "dGVzdA==", "array of ASCII bytes");
});

QUnit.test("encode then decode round-trips non-ASCII strings", function(assert) {
    var inputs = ["✓", "café", "\uD83D\uDCA9", "Iñtërnâtiônàlizætiøn☃\uD83D\uDCA9", "test", ""];
    inputs.forEach(function (input) {
        assert.equal(utf8.utf8decode(base64.decode(base64.encode(input))), input, "round-trip of " + JSON.stringify(input));
    });
});

QUnit.test("generateAsync with type base64 round-trips non-ASCII content", function(assert) {
    var zip = new JSZip();
    zip.file("a.txt", "✓");
    var done = assert.async();
    zip.generateAsync({type: "base64"}).then(function (content) {
        return JSZip.loadAsync(content, {base64: true});
    }).then(function (zip) {
        return zip.file("a.txt").async("string");
    }).then(function (fileContent) {
        assert.equal(fileContent, "✓", "Generated base64 ZIP can be parsed");
        done();
    })["catch"](JSZipTestUtils.assertNoError);
});
