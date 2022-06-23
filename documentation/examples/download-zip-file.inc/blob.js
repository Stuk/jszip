"use strict";

var zip = new JSZip();
zip.file("Hello.txt", "Hello world\n");

jQuery("#blob").on("click", function () {
    zip.generateAsync({type:"blob"}).then(function (blob) { // 1) generate the zip file
        saveAs(blob, "hello.zip");                          // 2) trigger the download
    }, function (err) {
        jQuery("#blob").text(err);
    });
});
