var fs = require("fs");

global.JSZip = require("../lib/index");

global.JSZipTestUtils = {
    loadZipFile: function(name, success, error) {
        fs.readFile(name, "binary", function(err, data) {
            if (err) {
                error(err);
            } else {
                success(data);
            }
        });
    }
};
