var FS = require("fs");

global.JSZip = require("../index");

global.JSZipTestUtils = {
    loadZipFile: function(name, success, error) {
        FS.readFile(name, "binary", function(err, data) {
            if (err) {
                error(err);
            } else {
                success(data);
            }
        });
    }
};
