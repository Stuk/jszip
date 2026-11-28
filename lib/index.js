"use strict";

/**
 * Representation a of zip file in js
 * @constructor
 */
function JSZip() {
    // if this constructor is used without `new`, it adds `new` before itself:
    if(!(this instanceof JSZip)) {
        return new JSZip();
    }

    if(arguments.length) {
        throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
    }

    // object containing the files :
    // {
    //   "folder/" : {...},
    //   "folder/data.txt" : {...}
    // }
    // NOTE: we use a null prototype because we do not
    // want filenames like "toString" coming from a zip file
    // to overwrite methods and attributes in a normal Object.
    this.files = Object.create(null);

    this.comment = null;

    // Where we are in the hierarchy
    this.root = "";
    this.clone = function() {
        var newObj = new JSZip();
        for (var i in this) {
            if (typeof this[i] !== "function") {
                newObj[i] = this[i];
            }
        }
        return newObj;
    };
}
JSZip.prototype = require("./object");
JSZip.prototype.loadAsync = require("./load");
JSZip.support = require("./support");

var defaults = require("./defaults");

/**
 * Warn that JSZip.defaults is deprecated. See #972.
 */
function warnDefaultsDeprecated() {
    if (typeof console !== "undefined" && typeof console.warn === "function") {
        console.warn("JSZip.defaults is deprecated and will be removed in a future version. " +
            "Prefer passing the options to each file() or generateAsync() call instead.");
    }
}

/**
 * @deprecated JSZip.defaults is deprecated and will be removed in a future
 * version. Prefer passing the options to each file() or generateAsync() call
 * instead. See https://github.com/Stuk/jszip/issues/972
 *
 * Reading or writing this property prints a deprecation warning. The
 * underlying defaults object is shared: mutating it still changes the
 * options applied to new files and folders, and assigning a new object
 * merges its properties into it (the object itself is never rebound, so
 * code holding a reference to it keeps working).
 */
Object.defineProperty(JSZip, "defaults", {
    configurable: true,
    enumerable: true,
    get: function () {
        warnDefaultsDeprecated();
        return defaults;
    },
    set: function (value) {
        warnDefaultsDeprecated();
        if (value && typeof value === "object") {
            // Merge the new values into the shared defaults object instead
            // of rebinding it, so the object keeps all of its fields (a
            // partial object must not drop the others) and code holding a
            // reference to it keeps working.
            Object.keys(value).forEach(function (key) {
                defaults[key] = value[key];
            });
        }
    }
});

// TODO find a better way to handle this version,
// a require('package.json').version doesn't work with webpack, see #327
JSZip.version = "3.10.2";

JSZip.loadAsync = function (content, options) {
    return new JSZip().loadAsync(content, options);
};

JSZip.external = require("./external");
module.exports = JSZip;
