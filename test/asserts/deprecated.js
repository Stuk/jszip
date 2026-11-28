"use strict";

QUnit.module("deprecated");

QUnit.test("Removed load method throws an exception", function(assert) {
    assert.throws(
        function() {
            new JSZip().load("");
        },
        /upgrade guide/,
        "load() throws an exception"
    );
});
QUnit.test("Removed constructor with data throws an exception", function(assert) {
    assert.throws(
        function() {
            // eslint-disable-next-line no-new
            new JSZip("");
        },
        /upgrade guide/,
        "new JSZip(data) throws an exception"
    );
});
QUnit.test("Removed asText method throws an exception", function(assert) {
    var file = JSZipTestUtils.createZipAll().file("Hello.txt");
    assert.throws(
        function() {
            file.asText();
        },
        /upgrade guide/,
        "file.asText() throws an exception"
    );
});
QUnit.test("Removed generate method throws an exception", function(assert) {
    assert.throws(
        function() {
            new JSZip().generate({type:"string"});
        },
        /upgrade guide/,
        "generate() throws an exception"
    );
});

QUnit.test("Reading JSZip.defaults prints a deprecation warning", function(assert) {
    var warned = [];
    var originalWarn = console.warn;
    console.warn = function (message) {
        warned.push(message);
    };
    try {
        var defaults = JSZip.defaults;
        assert.ok(defaults, "JSZip.defaults is still readable");
        assert.equal(warned.length, 1, "one warning is printed");
        assert.ok(/deprecated/i.test(warned[0]), "the warning says deprecated");
    } finally {
        console.warn = originalWarn;
    }
});

QUnit.test("Writing JSZip.defaults prints a deprecation warning and applies the new values", function(assert) {
    var warned = [];
    var originalWarn = console.warn;
    console.warn = function (message) {
        warned.push(message);
    };
    var saved = null;
    try {
        saved = Object.assign({}, JSZip.defaults); // one warning, for the read
        var newDate = new Date("2020-01-01T00:00:00Z");
        JSZip.defaults = {date: newDate}; // one warning, for the write
        assert.equal(warned.length, 2, "one warning for the read and one for the write");
        assert.ok(/deprecated/i.test(warned[1]), "the warning says deprecated");
        var zip = new JSZip();
        zip.file("Hello.txt", "Hello World");
        assert.equal(zip.files["Hello.txt"].date.getTime(), newDate.getTime(), "the new default date is applied to new files");
        assert.equal(JSZip.defaults.createFolders, true, "the other defaults are left alone");
    } finally {
        if (saved) {
            JSZip.defaults = saved;
        }
        console.warn = originalWarn;
    }
});

QUnit.test("Mutating a field of JSZip.defaults still changes new files", function(assert) {
    var warned = [];
    var originalWarn = console.warn;
    console.warn = function (message) {
        warned.push(message);
    };
    var saved = null;
    try {
        saved = Object.assign({}, JSZip.defaults); // one warning, for the read
        var newDate = new Date("2021-06-15T12:00:00Z");
        JSZip.defaults.date = newDate; // reads JSZip.defaults, one more warning
        assert.equal(warned.length, 2, "one warning for the save read and one for the access");
        var zip = new JSZip();
        zip.file("Hello.txt", "Hello World");
        assert.equal(zip.files["Hello.txt"].date.getTime(), newDate.getTime(), "the mutated default date is applied to new files");
    } finally {
        if (saved) {
            JSZip.defaults = saved;
        }
        console.warn = originalWarn;
    }
});

QUnit.test("No warning when JSZip.defaults is never touched", function(assert) {
    var warned = [];
    var originalWarn = console.warn;
    console.warn = function (message) {
        warned.push(message);
    };
    try {
        var zip = new JSZip();
        zip.file("Hello.txt", "Hello World");
        zip.folder("folder");
        assert.equal(warned.length, 0, "no warning is printed during normal use");
    } finally {
        console.warn = originalWarn;
    }
});

QUnit.test("Assigning a non-object to JSZip.defaults does not wipe the defaults", function(assert) {
    var warned = [];
    var originalWarn = console.warn;
    console.warn = function (message) {
        warned.push(message);
    };
    var saved = null;
    try {
        saved = Object.assign({}, JSZip.defaults); // one warning, for the read
        JSZip.defaults = null; // one warning, for the write, then ignored
        assert.equal(warned.length, 2, "one warning for the read and one for the write");
        assert.equal(JSZip.defaults.createFolders, true, "the defaults are unchanged");
    } finally {
        if (saved) {
            JSZip.defaults = saved;
        }
        console.warn = originalWarn;
    }
});
