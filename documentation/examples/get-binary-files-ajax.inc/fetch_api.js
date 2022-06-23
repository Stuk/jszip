"use strict";

fetch("{{site.baseurl}}/test/ref/text.zip")       // 1) fetch the url
    .then(function (response) {                       // 2) filter on 200 OK
        if (response.status === 200 || response.status === 0) {
            return Promise.resolve(response.blob());
        } else {
            return Promise.reject(new Error(response.statusText));
        }
    })
    .then(JSZip.loadAsync)                            // 3) chain with the zip promise
    .then(function (zip) {
        return zip.file("Hello.txt").async("string"); // 4) chain with the text content promise
    })
    .then(function success(text) {                    // 5) display the result
        $("#fetch").append($("<p>", {
            "class": "alert alert-success",
            text: "loaded, content = " + text
        }));
    }, function error(e) {
        $("#fetch").append($("<p>", {
            "class": "alert alert-danger",
            text: e
        }));
    });
