"use strict";

// 1) get a promise of the content
var promise = new JSZip.external.Promise(function (resolve, reject) {
    JSZipUtils.getBinaryContent("{{site.baseurl}}/test/ref/text.zip", function(err, data) {
        if (err) {
            reject(err);
        } else {
            resolve(data);
        }
    });
});

promise.then(JSZip.loadAsync)                     // 2) chain with the zip promise
    .then(function(zip) {
        return zip.file("Hello.txt").async("string"); // 3) chain with the text content promise
    })
    .then(function success(text) {                    // 4) display the result
        $("#jszip_utils").append($("<p>", {
            "class": "alert alert-success",
            text: "loaded, content = " + text
        }));
    }, function error(e) {
        $("#jszip_utils").append($("<p>", {
            "class": "alert alert-danger",
            text: e
        }));
    });
