var fs = require("fs");

global.JSZip = require("../lib/index");

global.JSZipTestUtils = {
    loadZipFile: function(name, callback) {
        fs.readFile(name, "binary", callback);
    }
};
